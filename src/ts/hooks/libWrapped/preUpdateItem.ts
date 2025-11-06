import type { DatabaseUpdateOperation } from '@common/abstract/_module.mjs'
import { SpellPreparationMode } from '../../constants.ts'
import {
    getActiveSpellList,
    getMaxPreparedSpells,
} from '../../services/spellLists.ts'
import { log } from '../../util/log.ts'

export async function preUpdateItem(
    this: SpellItem,
    wrapped: (
        changes: Partial<SpellItem>,
        options: DatabaseUpdateOperation<Item>,
        user: User,
    ) => Promise<boolean | undefined>,
    changes: Partial<SpellItem>,
    options: DatabaseUpdateOperation<Item>,
    user: User,
): Promise<boolean | undefined> {
    const next = () => wrapped(changes, options, user)

    if (changes?.type !== 'spell') {
        // Ignore non-spells
        next()
        return
    }

    if (this.system.level < 1) {
        // Ignore cantrips
        next()
        return
    }

    if (changes.system?.prepared === undefined) {
        // Ignore changes that don't affect the prepared state
        next()
        return
    }

    const actorId = this.parent?.id
    if (!actorId) {
        log.warn(
            `Spell ${this.name} has no parent actor, cannot update spell list`,
        )
        next()
        return
    }

    if (changes.system.prepared !== SpellPreparationMode.PREPARED) {
        // Only handle preparing spells here
        next()
        return
    }

    if (changes.ignoreSpellLimitCheck === true) {
        delete changes.ignoreSpellLimitCheck
        return
    }

    const actor = game.actors.get(actorId)
    if (!actor) {
        log.warn(
            `Actor with ID ${actorId} not found, cannot update spell list for spell ${this.name}`,
        )
        next()
        return
    }

    const maxPreparedSpells = await getMaxPreparedSpells(actorId)

    const totalPreparedSpells = Object.values(maxPreparedSpells).reduce(
        (sum, val) => sum + val,
        0,
    )

    const activeSpellList = await getActiveSpellList(actorId)
    if (!activeSpellList) {
        log.warn(
            `No active spell list for actor ${actor.name}, cannot enforce prepared spell limits`,
        )
        next()
        return
    }

    for (const sourceClass of Object.keys(maxPreparedSpells)) {
        const classPreparedSpells = activeSpellList.spells.filter(
            (spell) => spell.sourceClass === sourceClass,
        )

        if (classPreparedSpells.length >= maxPreparedSpells[sourceClass]) {
            const actorClass = actor.items.find(
                (item) =>
                    item.type === 'class' &&
                    (item as ClassItem).system.identifier === sourceClass,
            )

            // TODO: i18n
            foundry.ui.notifications.warn(
                `Actor "${actor.name}" is exceeding prepared spell limit for ${actorClass ? `class "${actorClass.name}"` : 'their class.'}.`,
            )

            return false
        }
    }

    if (activeSpellList.spells.length < totalPreparedSpells) {
        // Within limits
        next()
        return
    }

    // TODO: i18n
    foundry.ui.notifications.warn(
        `Actor "${actor.name}" is exceeding prepared spell limit.`,
    )

    return false
}

import type { DatabaseUpdateOperation } from '@common/abstract/_module.mjs'
import { ItemTypes, SpellPreparationMode } from '../../constants.ts'
import { log } from '../../util/log.ts'
import { actors } from '../../services/foundry/actors.ts'
import { SpellListRepository } from '../../services/spellLists/repository.ts'

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

    if (changes?.type !== ItemTypes.Spell) {
        // Ignore non-spells
        return next()
    }

    if (this.system.level < 1) {
        // Ignore cantrips
        return next()
    }

    if (changes.system?.prepared === undefined) {
        // Ignore changes that don't affect the prepared state
        return next()
    }

    if (changes.system.prepared !== SpellPreparationMode.PREPARED) {
        // Only handle preparing spells here
        return next()
    }

    if (changes.ignoreSpellLimitCheck === true) {
        // Ignore if the spell change should be ignored by this check

        delete changes.ignoreSpellLimitCheck
        return next()
    }

    const actorId = this.parent?.id
    if (!actorId) {
        log.warn(
            `Spell ${this.name} has no parent actor, cannot update spell list`,
        )

        return next()
    }

    const actor = game.actors.get(actorId)
    if (!actor) {
        log.warn(
            `Actor with ID ${actorId} not found, cannot update spell list for spell ${this.name}`,
        )

        return next()
    }

    const repo = SpellListRepository.forActor(actorId)

    const maxPreparedSpells = actors.getMaxPreparedSpells(actorId)
    const totalMaxPreparedSpells = Object.values(maxPreparedSpells).reduce(
        (sum, val) => sum + val,
        0,
    )

    const activeSpellList = await repo.getActive()
    if (!activeSpellList) {
        log.warn(
            `No active spell list for actor ${actor.name}, cannot enforce prepared spell limits`,
        )
        return next()
    }

    if (activeSpellList.spells.some((spell) => spell.id === this.id)) {
        // Ignore, if the spell is already on the current list

        return next()
    }

    for (const sourceClass of Object.keys(maxPreparedSpells)) {
        const classPreparedSpells = activeSpellList.spells.filter(
            (spell) => spell.sourceClass === sourceClass,
        )

        if (classPreparedSpells.length < maxPreparedSpells[sourceClass]) {
            // There is still room for more prepared spells; nothing to do
            continue
        }

        const actorClass = actors.getClass(actor, sourceClass)

        if (!actorClass) {
            foundry.ui.notifications.warn(
                'FSL.ui.notifications.warn.exceedsUnknownClassPreparedSpells',
                {
                    localize: true,
                    format: {
                        actorName: actor.name,
                    },
                },
            )
        } else {
            foundry.ui.notifications.warn(
                'FSL.ui.notifications.warn.exceedsClassPreparedSpells',
                {
                    localize: true,
                    format: {
                        actorName: actor.name,
                        className: actorClass?.name,
                    },
                },
            )
        }

        // Prevent updating the spell
        return false
    }

    if (activeSpellList.spells.length < totalMaxPreparedSpells) {
        // Within limits
        return next()
    }

    foundry.ui.notifications.warn(
        'FSL.ui.notifications.warn.exceedsPreparedSpellsGeneric',
        { localize: true, format: { actorName: actor.name } },
    )

    // Prevent updating the spell
    return false
}

import { ItemTypes, SpellPreparationMode } from '../../constants.ts'
import { log } from '../../util/log.ts'
import { SpellListRepository } from '../spellLists/repository.ts'
import { actors } from './actors.ts'

async function exceedsPreparedSpellLimit(
    spell: SpellItem,
    changes: Partial<SpellItem>,
): Promise<boolean> {
    if (changes?.type !== ItemTypes.Spell) {
        // Ignore non-spells
        return false
    }

    if (spell.system.level < 1) {
        // Ignore cantrips
        return false
    }

    if (changes.system?.prepared === undefined) {
        // Ignore changes that don't affect the prepared state
        return false
    }

    if (changes.system.prepared !== SpellPreparationMode.PREPARED) {
        // Only handle preparing spells here
        return false
    }

    if (changes.ignoreSpellLimitCheck === true) {
        // Ignore if the spell change should be ignored by this check

        delete changes.ignoreSpellLimitCheck
        return false
    }

    const actorId = spell.parent?.id
    if (!actorId) {
        log.warn(
            `Spell ${spell.name} has no parent actor, cannot update spell list`,
        )

        return false
    }

    const actor = game.actors.get(actorId)
    if (!actor) {
        log.warn(
            `Actor with ID ${actorId} not found, cannot update spell list for spell ${spell.name}`,
        )

        return false
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
        return false
    }

    if (activeSpellList.spells.some((spell) => spell.id === spell.id)) {
        // Ignore, if the spell is already on the current list

        return false
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
        return false
    }

    foundry.ui.notifications.warn(
        'FSL.ui.notifications.warn.exceedsPreparedSpellsGeneric',
        { localize: true, format: { actorName: actor.name } },
    )

    // Prevent updating the spell
    return false
}

export const items = {
    exceedsPreparedSpellLimit,
}

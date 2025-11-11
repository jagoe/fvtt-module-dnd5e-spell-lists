import { ItemTypes, SpellPreparationMode } from '../../constants.ts'
import { SpellListRepository } from '../../services/spellLists/repository.ts'
import { log } from '../../util/log.ts'
import { Listener } from '../index.ts'

export const UpdateItem: Listener = {
    listen(): void {
        Hooks.on(
            'updateItem',
            async (item, changes: Partial<SpellItem>, _operation) => {
                if (item.type !== ItemTypes.Spell) {
                    // Ignore non-spells
                    return
                }

                const spell = item as SpellItem

                const actorId = spell.parent?.id
                if (!actorId) {
                    log.warn(
                        `Spell ${spell.name} has no parent actor, cannot update spell list`,
                    )
                    return
                }

                const repo = SpellListRepository.forActor(actorId)

                const hasSpellTypeChange =
                    changes.system?.method !== undefined ||
                    changes.system?.level !== undefined

                const changesToIrrelevantSpell =
                    changes.system?.method !== 'spell' ||
                    changes.system?.level < 1

                if (hasSpellTypeChange && changesToIrrelevantSpell) {
                    // The spell no longer counts as a prepared spell
                    await repo.removeSpellFromAll(spell.id)

                    return
                }

                if (spell.system.level < 1) {
                    // Ignore cantrips
                    return
                }

                if (
                    changes.system?.prepared === undefined &&
                    !hasSpellTypeChange
                ) {
                    // Ignore changes that don't affect the prepared state, but only if the spell type doesn't change
                    return
                }

                const preparedState =
                    hasSpellTypeChange && changes.system?.prepared === undefined
                        ? spell.system.prepared
                        : changes.system?.prepared

                if (preparedState === SpellPreparationMode.NOT_PREPARED) {
                    await repo.removeSpell(spell.id)
                    return
                }

                if (preparedState === SpellPreparationMode.PREPARED) {
                    await repo.addSpells([
                        { id: spell.id, sourceClass: spell.system.sourceClass },
                    ])
                    return
                }

                if (preparedState === SpellPreparationMode.ALWAYS_PREPARED) {
                    await repo.removeSpellFromAll(spell.id)
                    return
                }

                // Unknown prepared state
                log.warn(
                    `Unknown prepared state for spell ${spell.name}: ${preparedState}`,
                )
            },
        )
    },
}

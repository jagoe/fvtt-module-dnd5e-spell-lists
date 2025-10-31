import { SpellPreparationMode } from '../../constants.ts'
import {
    addToSpellList,
    removeFromAllSpellLists,
    removeFromSpellList,
} from '../../services/spellLists.ts'
import { log } from '../../util/log.ts'
import { Listener } from '../index.ts'

export const UpdateItem: Listener = {
    listen(): void {
        Hooks.on(
            'updateItem',
            async (item, changes: Partial<SpellItem>, _operation) => {
                if (item.type !== 'spell') {
                    // Ignore non-spells
                    return
                }

                const spell = item as SpellItem

                if (spell.system.level < 1) {
                    // Ignore cantrips
                    return
                }

                if (changes.system?.prepared === undefined) {
                    // Ignore changes that don't affect the prepared state
                    return
                }

                const actorId = spell.parent?.id
                if (!actorId) {
                    log.warn(
                        `Spell ${spell.name} has no parent actor, cannot update spell list`,
                    )
                    return
                }

                if (
                    changes.system.prepared ===
                    SpellPreparationMode.NOT_PREPARED
                ) {
                    await removeFromSpellList(actorId, spell.id)
                    return
                }

                if (changes.system.prepared === SpellPreparationMode.PREPARED) {
                    await addToSpellList(actorId, [
                        { id: spell.id, sourceClass: spell.system.sourceClass },
                    ])
                    return
                }

                if (
                    changes.system.prepared ===
                    SpellPreparationMode.ALWAYS_PREPARED
                ) {
                    await removeFromAllSpellLists(actorId, spell.id)
                    return
                }

                // Unknown prepared state
                log.warn(
                    `Unknown prepared state for spell ${spell.name}: ${changes.system.prepared}`,
                )
            },
        )
    },
}

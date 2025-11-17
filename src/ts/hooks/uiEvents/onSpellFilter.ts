import {
    ELEMENT_SELECTOR_SPELL_FILTER,
    ELEMENT_SELECTOR_SPELL_LIST_CONTROLS,
    SpellFilterCategories,
} from '../../constants.ts'
import { SpellListRepository } from '../../services/spellLists/repository.ts'
import { getClosestElement } from '../../util/getClosestElement.ts'
import { log } from '../../util/log.ts'
import { Listener } from '../index.ts'

export const OnFilterSpells: Listener = {
    listen: function (): void {
        document.addEventListener('mouseup', async (e) => {
            const contextMenuEntry = getClosestElement(
                e.target,
                ELEMENT_SELECTOR_SPELL_FILTER,
            )

            if (!contextMenuEntry) {
                return
            }

            const contextMenuTrigger = ui.context.target
            const itemListControls = getClosestElement<ItemListControls>(
                contextMenuTrigger,
                ELEMENT_SELECTOR_SPELL_LIST_CONTROLS,
            )
            if (!itemListControls) {
                return
            }

            const filter = contextMenuEntry.dataset
                .filter as SpellFilterCategories
            if (!filter) {
                return
            }

            const properties = new Set(itemListControls.state.properties)
            if (properties.has(filter)) {
                properties.delete(filter)
            } else {
                properties.add(filter)
            }

            log.trace(
                'Clicked filter:',
                filter,
                '|',
                [...properties].join(', '),
            )

            const actorId = itemListControls.app.options.document.id
            const repo = SpellListRepository.forActor(actorId)
            const activeSpellList = await repo.getActive()

            await repo.update({
                id: activeSpellList.id,
                displayOptions: {
                    ...(activeSpellList.displayOptions ?? {}),
                    filter: [...properties],
                },
            })
        })
    },
}

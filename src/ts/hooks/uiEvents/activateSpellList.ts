import {
    activateSpellList,
    getSpellLists,
    saveSpellLists,
} from '../../services/spellLists.ts'
import { Listener } from '../index.ts'

export const ActivateSpellList: Listener = {
    listen(): void {
        document.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement
            if (target.dataset.action !== 'activate-spell-list') {
                return
            }

            event.preventDefault()

            const spellListId = target.dataset.spellListId
            const parent = target.closest('[data-actor-id]') as HTMLElement
            const actorId = parent?.dataset.actorId

            if (!actorId || !spellListId) {
                return
            }

            const spellLists = await getSpellLists(actorId)
            await activateSpellList(spellListId, spellLists)
            await saveSpellLists(actorId, spellLists)
        })
    },
}

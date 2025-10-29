import {
    createEmptySpellList,
    saveSpellList,
} from '../../services/spellLists.ts'
import { Listener } from '../index.ts'

export const AddSpellList: Listener = {
    listen(): void {
        document.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement
            if (target.dataset.action !== 'add-spell-list') {
                return
            }

            event.preventDefault()

            const actorId = target.dataset.actorId
            if (!actorId) {
                return
            }

            const spellList = createEmptySpellList()
            spellList.name = 'New Spell List' // TODO: User input

            await saveSpellList(actorId, spellList)
        })
    },
}

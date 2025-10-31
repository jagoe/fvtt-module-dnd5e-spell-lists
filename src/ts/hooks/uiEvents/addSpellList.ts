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

            const parent = target.closest('[data-actor-id]') as HTMLElement
            const actorId = parent?.dataset.actorId

            if (!actorId) {
                return
            }

            const spellList = createEmptySpellList()

            const data = await (
                foundry.applications.api
                    .DialogV2 as unknown as DialogV2WithInput
            ).input<{ name: string }>({
                window: { title: 'Spell List Name' },
                content: `<input type="text" name="name" placeholder="Enter spell list name" />`,
                ok: {
                    label: 'Create',
                    icon: 'fa-solid fa-floppy-disk',
                },
            })

            spellList.name = data?.name || 'New Spell List'

            await saveSpellList(actorId, spellList)
        })
    },
}

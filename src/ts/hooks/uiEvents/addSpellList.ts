import { SpellListRepository } from '../../services/spellLists/repository.ts'
import { promptSpellListName } from '../../ui/spellListTabs.ts'
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

            const repo = SpellListRepository.forActor(actorId)

            const name = (await promptSpellListName()) || 'New Spell List'

            const created = await repo.create({ name })
            await repo.activate(created.id)
        })
    },
}

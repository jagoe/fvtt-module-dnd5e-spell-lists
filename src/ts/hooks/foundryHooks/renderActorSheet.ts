import { ApplicationRenderOptions } from '@client/applications/_module.mjs'
import { Listener } from '../index.ts'
import { createOrUpdateSpellListTabs } from '../../ui/spellListTabs.ts'
import { initializeDefaultSpellList } from '../../services/spellLists.ts'
import { SpellListRepository } from '../../services/spellLists/repository.ts'
import { actors } from '../../services/foundry/actors.ts'

export const RenderActorSheet: Listener = {
    listen(): void {
        Hooks.on(
            'renderCharacterActorSheet',
            async (
                _app: CharacterActorSheet,
                html: HTMLElement,
                _data: CharacterActorSheetData,
                _renderOptions: ApplicationRenderOptions,
            ) => {
                const actorId = _data.actor?.id
                if (!actorId) {
                    return
                }

                const actorCanPrepareSpells = actors.canPrepareSpells(actorId)

                if (!actorCanPrepareSpells) {
                    return
                }

                const repo = SpellListRepository.forActor(actorId)
                let spellLists = await repo.getAll()

                if (!spellLists || spellLists.length === 0) {
                    await initializeDefaultSpellList(actorId)
                }

                await createOrUpdateSpellListTabs(html, actorId)
            },
        )
    },
}

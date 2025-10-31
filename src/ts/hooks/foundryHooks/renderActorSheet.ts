import { ApplicationRenderOptions } from '@client/applications/_module.mjs'
import { Listener } from '../index.ts'
import { createOrUpdateSpellListTabs } from '../../ui/spellListTabs.ts'
import {
    canPrepareSpells,
    getSpellLists,
    initializeDefaultSpellList,
} from '../../services/spellLists.ts'

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

                const actorCanPrepareSpells = await canPrepareSpells(actorId)

                if (!actorCanPrepareSpells) {
                    return
                }

                let spellLists = await getSpellLists(actorId)
                if (!spellLists || spellLists.length === 0) {
                    await initializeDefaultSpellList(actorId)
                }

                await createOrUpdateSpellListTabs(html, actorId, spellLists)
            },
        )
    },
}

import { ApplicationRenderOptions } from '@client/applications/_module.mjs'
import { Listener } from '../index.ts'
import { createOrUpdateSpellListTabs } from '../../ui/spellListTabs.ts'
import {
    DEFAULT_SPELL_LIST_ID,
    getSpellLists,
    saveSpellLists,
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

                let spellLists = await getSpellLists(_data.actor?.id || '')
                if (!spellLists || spellLists.length === 0) {
                    spellLists = [
                        {
                            name: 'Default', // TODO: i18n
                            id: DEFAULT_SPELL_LIST_ID,
                            isActive: true,
                        },
                    ]

                    await saveSpellLists(actorId, spellLists)
                }

                await createOrUpdateSpellListTabs(html, actorId, spellLists)
            },
        )
    },
}

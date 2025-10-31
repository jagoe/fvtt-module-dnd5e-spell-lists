import { ApplicationRenderOptions } from '@client/applications/_module.mjs'
import { Listener } from '../index.ts'
import { createOrUpdateSpellListTabs } from '../../ui/spellListTabs.ts'
import {
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

                const actor = game.actors.get(actorId) as Character
                if (!actor) {
                    return
                }

                const canPrepareSpells = Object.values(actor.system.scale).some(
                    (c) => c['max-prepared'],
                )

                if (!canPrepareSpells) {
                    // Actor cannot prepare spells, no spell lists needed
                    return
                }

                let spellLists = await getSpellLists(_data.actor?.id || '')
                if (!spellLists || spellLists.length === 0) {
                    await initializeDefaultSpellList(actorId)
                }

                await createOrUpdateSpellListTabs(html, actorId, spellLists)
            },
        )
    },
}

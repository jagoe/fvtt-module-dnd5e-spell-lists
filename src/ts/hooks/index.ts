import { Init } from './foundryHooks/init.ts'
import { RenderActorSheet } from './foundryHooks/renderActorSheet.ts'
import { Setup } from './foundryHooks/setup.ts'
import { UpdateItem } from './foundryHooks/updateItem.ts'
import { ActivateSpellList } from './uiEvents/activateSpellList.ts'
import { AddSpellList } from './uiEvents/addSpellList.ts'

interface Listener {
    listen(): void
}

const HooksModule: Listener = {
    listen(): void {
        const listeners: Listener[] = [
            // Foundry hooks
            Init,
            Setup,
            RenderActorSheet,
            UpdateItem,

            // UI events
            AddSpellList,
            ActivateSpellList,
        ]

        for (const listener of listeners) {
            listener.listen()
        }
    },
}

export { HooksModule }
export type { Listener }

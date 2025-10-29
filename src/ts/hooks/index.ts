import { Init } from './foundryHooks/init.ts'
import { RenderActorSheet } from './foundryHooks/renderActorSheet.ts'
import { Setup } from './foundryHooks/setup.ts'
import { ActivateSpellList } from './uiEvents/activateSpellList.ts'
import { AddSpellList } from './uiEvents/addSpellList.ts'

interface Listener {
    listen(): void
}

const HooksModule: Listener = {
    listen(): void {
        const listeners: Listener[] = [
            Init,
            Setup,
            RenderActorSheet,
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

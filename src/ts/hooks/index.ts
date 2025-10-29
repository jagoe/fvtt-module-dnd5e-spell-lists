import { Init } from './foundryHooks/init.ts'
import { RenderActorSheet } from './foundryHooks/renderActorSheet.ts'
import { Setup } from './foundryHooks/setup.ts'
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
        ]

        for (const listener of listeners) {
            listener.listen()
        }
    },
}

export { HooksModule }
export type { Listener }

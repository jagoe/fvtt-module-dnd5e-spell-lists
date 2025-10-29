import { Listener } from '../index.ts'

export const Setup: Listener = {
    listen(): void {
        Hooks.once('setup', () => {
            if (BUILD_MODE === 'development') {
                CONFIG.debug.hooks = true
            }
        })
    },
}

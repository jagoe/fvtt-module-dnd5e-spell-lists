import { MODULE_ID } from '../../constants.ts'
import { Listener } from '../index.ts'
import { libWrapper } from '@static/lib/shim.ts'
import { preUpdateItem } from '../libWrapped/preUpdateItem.ts'

export const Setup: Listener = {
    listen(): void {
        Hooks.once('setup', () => {
            if (BUILD_MODE === 'development') {
                CONFIG.debug.hooks = true
            }

            libWrapper.register(
                MODULE_ID,
                'Item.prototype._preUpdate',
                preUpdateItem,
            )
        })
    },
}

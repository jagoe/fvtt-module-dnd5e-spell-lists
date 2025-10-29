import { ThisModule } from '../../api.ts'
import { MODULE_ID } from '../../constants.ts'
import { HandlebarHelpers } from '../../handlebar-helpers.ts'
import { Settings } from '../../settings.ts'
import { log } from '../../util/log.ts'
import { Listener } from '../index.ts'

export const Init: Listener = {
    listen(): void {
        Hooks.once('init', () => {
            new Settings().register()
            new HandlebarHelpers().register()
            ;(game.modules.get(MODULE_ID) as ThisModule).api = {
                noop: (): void => {},
            }

            log.info('Initialized')
        })
    },
}

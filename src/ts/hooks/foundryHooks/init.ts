import { ThisModule } from '../../api.ts'
import { MODULE_ID } from '../../constants.ts'
import { HandlebarHelpers } from '../../handlebar-helpers.ts'
import { resetEverything } from '../../services/spellLists.ts'
import { SpellListRepository } from '../../services/spellLists/repository.ts'
import { Settings } from '../../settings.ts'
import { log } from '../../util/log.ts'
import { Listener } from '../index.ts'

export const Init: Listener = {
    listen(): void {
        Hooks.once('init', () => {
            new Settings().register()
            new HandlebarHelpers().register()

            const module = game.modules.get(MODULE_ID) as ThisModule
            module.api = {
                resetEverything,
                resetCharacter: async (actorId: string) => {
                    const repo = SpellListRepository.forActor(actorId)
                    await repo.reset()
                },
            }

            log.info('Initialized')
        })
    },
}

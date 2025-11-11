import type Module from '@client/packages/module.d.mts'

interface ThisModule extends Module {
    api: ThisApi
}

interface ThisApi {
    resetEverything(): Promise<void>
    resetCharacter(actorId: string): Promise<void>
}

export { type ThisModule, type ThisApi }

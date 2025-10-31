import type Module from '@client/packages/module.d.mts'

interface ThisModule extends Module {
    api: ThisApi
}

interface ThisApi {
    resetAll(): Promise<void>
    resetCharacter(actorId: string): Promise<void>
}

export { type ThisModule, type ThisApi }

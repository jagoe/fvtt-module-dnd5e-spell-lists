import type Module from '@client/packages/module.d.mts'

interface ThisModule extends Module {
    api: ThisApi
}

interface ThisApi {
    noop(): void
}

export { type ThisModule, type ThisApi }

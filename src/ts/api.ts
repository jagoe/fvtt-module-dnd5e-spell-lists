import type Module from "@client/packages/module.d.mts";

interface ThisModule extends Module {
    api: ThisApi;
}

interface ThisApi {}

export { type ThisModule, type ThisApi };

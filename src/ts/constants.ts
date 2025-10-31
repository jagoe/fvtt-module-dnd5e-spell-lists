import moduleData from '@static/module.json' with { type: 'json' }

export const MODULE_ID = moduleData.id
export const MODULE_NAME = moduleData.title
export const TEMPLATE_PATH = `/modules/${MODULE_ID}/templates`

export enum SpellPreparationMode {
    NOT_PREPARED = 0,
    PREPARED = 1,
    ALWAYS_PREPARED = 2,
}

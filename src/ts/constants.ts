import moduleData from '@static/module.json' with { type: 'json' }

export const MODULE_ID = moduleData.id
export const MODULE_NAME = moduleData.title
export const TEMPLATE_PATH = `/modules/${MODULE_ID}/templates`

export const SPELL_LISTS_STORE_PROPERTY = 'spellLists'
export const DEFAULT_SPELL_LIST_ID = 'default'
export const IGNORE_SPELL_LIMIT_CHECK_KEY = 'ignoreSpellLimitCheck'

export enum SpellPreparationMode {
    NOT_PREPARED = 0,
    PREPARED = 1,
    ALWAYS_PREPARED = 2,
}

export enum ItemTypes {
    Spell = 'spell',
    Class = 'class',
}

export enum SpellFilterCategories {
    Prepared = 'prepared',
}

export enum SpellSortCategories {
    Alphabetically = 'a',
    Priority = 'p',
    Manually = 'm',
}

import moduleData from '@static/module.json' with { type: 'json' }

export const MODULE_ID = moduleData.id
export const MODULE_NAME = moduleData.title
export const TEMPLATE_PATH = `/modules/${MODULE_ID}/templates`

export const ELEMENT_SELECTOR_SPELL_LIST_CONTROLS =
    'item-list-controls[for=spells]'
export const ELEMENT_SELECTOR_SPELL_FILTER = '[data-filter]'

export const SPELL_LISTS_STORE_PROPERTY = 'spellLists'
export const DEFAULT_SPELL_LIST_ID = 'default'
export const IGNORE_SPELL_LIMIT_CHECK_KEY = 'ignoreSpellLimitCheck'

export const SYSTEM_FLAG_SPELL_SORT_MODE =
    'sheetPrefs.character.tabs.spells.sort'

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

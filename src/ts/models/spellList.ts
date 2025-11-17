import { SpellFilterCategories, SpellSortCategories } from '../constants.ts'

export type SpellList = {
    id: string
    name: string
    isActive: boolean
    spells: SpellListEntry[]
    displayOptions?: {
        search?: string
        filter?: SpellFilterCategories[]
        sort?: SpellSortCategories
    }
}

export type SpellListEntry = {
    id: string
    sourceClass: string
}

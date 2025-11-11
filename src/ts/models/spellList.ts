export type SpellList = {
    id: string
    name: string
    isActive: boolean
    spells: SpellListEntry[]
}

export type SpellListEntry = {
    id: string
    sourceClass: string
}

export type SpellList = {
    name: string
    id: string
    isActive: boolean
    spells: SpellListEntry[]
}

export type SpellListEntry = {
    id: string
    sourceClass: string
}

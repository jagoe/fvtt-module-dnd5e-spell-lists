import {
    IGNORE_SPELL_LIMIT_CHECK_KEY,
    ItemTypes,
    SpellPreparationMode,
} from '../../constants.ts'

function get(id: string): Actor {
    const actor = game.actors?.get(id)

    if (!actor) {
        throw new Error(`Actor with ID ${id} not found`)
    }

    return actor
}

function getPCs(): Actor[] {
    return game.actors?.filter((actor) => actor.type === 'character')
}

function getMaxPreparedSpells(actorId: string): Record<string, number> {
    const actor = actors.get(actorId)

    const classes = actor.items.filter(
        (item) => item.type === ItemTypes.Class,
    ) as ClassItem[]

    return classes.reduce(
        (dict, current) => ({
            ...dict,
            ...(current.system.spellcasting.preparation?.max
                ? {
                      [current.system.identifier]:
                          current.system.spellcasting.preparation?.max,
                  }
                : {}),
        }),
        {} as Record<string, number>,
    )
}

function canPrepareSpells(actorId: string): boolean {
    const maxPreparedSpells = getMaxPreparedSpells(actorId)

    return !!Object.keys(maxPreparedSpells).length
}

function getCurrentlyPreparedSpells(actor: Actor): Item<Actor>[] {
    return actor.items.filter((item) => {
        if (item.type !== ItemTypes.Spell) {
            return false
        }

        const spell = item as SpellItem
        return (
            spell.system.level > 0 &&
            spell.system.prepared === SpellPreparationMode.PREPARED
        )
    })
}

async function setPreparedSpells(
    actor: Actor,
    preparedSpellIds: string[],
): Promise<void> {
    const currentlyPreparedSpells = actors
        .getCurrentlyPreparedSpells(actor)
        .map((spell) => spell.id)

    const spellsToPrepare = preparedSpellIds.filter(
        (id) => !currentlyPreparedSpells.includes(id),
    )

    const spellsToUnprepare = currentlyPreparedSpells.filter(
        (spellId) => !preparedSpellIds.some((id) => id === spellId),
    )

    const updates = [
        ...spellsToPrepare.map((id) => ({
            _id: id,
            'system.prepared': SpellPreparationMode.PREPARED,
            [IGNORE_SPELL_LIMIT_CHECK_KEY]: true,
        })),
        ...spellsToUnprepare.map((spellId) => ({
            _id: spellId,
            'system.prepared': SpellPreparationMode.NOT_PREPARED,
            [IGNORE_SPELL_LIMIT_CHECK_KEY]: true,
        })),
    ]

    await actor.updateEmbeddedDocuments('Item', updates)
}

async function unprepareAllSpells(actor: Actor): Promise<void> {
    const spells = actor.items
        .filter(
            (item) =>
                item.type === 'spell' &&
                (item as SpellItem).system.level > 0 &&
                (item as SpellItem).system.prepared ===
                    SpellPreparationMode.PREPARED,
        )
        .map((item) => ({
            _id: item.id,
            'system.prepared': SpellPreparationMode.NOT_PREPARED,
        }))

    await actor.updateEmbeddedDocuments('Item', spells)
}

function applyFilterAndSorting(
    actor: Actor,
    options: {
        filter?: Partial<ItemListControls['state']>
        sort?: Partial<ItemListControls['prefs']['sort']>
    },
): void {
    const actorSheet = actor.sheet?.element as unknown as HTMLElement

    const filter = actorSheet.querySelector(
        'item-list-controls[for=spells]',
    ) as ItemListControls

    if (
        options.filter?.properties &&
        !options.filter?.properties.equals(filter.state.properties)
    ) {
        filter.state.properties = options.filter?.properties
    }

    if (
        options.filter?.name !== undefined &&
        options.filter?.name !== filter.state.name
    ) {
        filter.state.name = options.filter?.name
    }

    if (options.sort && options.sort !== filter.prefs.sort) {
        filter.prefs.sort = options.sort
    }

    filter._applyFilters()
    filter._applySorting()
}

function getClass(actor: Actor, classId: string): ClassItem | undefined {
    return actor.items.find(
        (item) =>
            item.type === ItemTypes.Class &&
            (item as ClassItem).system.identifier === classId,
    ) as ClassItem | undefined
}

export const actors = {
    get,
    getPCs,
    getClass,
    canPrepareSpells,
    getCurrentlyPreparedSpells,
    getMaxPreparedSpells,
    applyFilterAndSorting,
    setPreparedSpells,
    unprepareAllSpells,
}

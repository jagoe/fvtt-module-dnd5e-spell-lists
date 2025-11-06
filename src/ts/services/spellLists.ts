import { MODULE_ID, SpellPreparationMode } from '../constants.ts'
import { SpellList, SpellListEntry } from '../models/spellList.ts'

export const DEFAULT_SPELL_LIST_ID = 'default'

const SPELL_LISTS_FLAG = 'spellLists'

// TODO: Separate data access layer and business logic

export function createEmptySpellList(): SpellList {
    return {
        name: '',
        id: '',
        isActive: false,
        spells: [],
    }
}

export async function saveSpellList(
    actorId: string,
    spellList: SpellList,
): Promise<void> {
    spellList.id = `${toSnakeCase(spellList.name)}_${foundry.utils.randomID(8)}`

    const spellLists = await getSpellLists(actorId)
    const existingIndex = spellLists.findIndex(
        (list) => list.id === spellList.id,
    )
    if (existingIndex !== -1) {
        spellLists[existingIndex] = spellList
    } else {
        spellLists.push(spellList)
    }

    await activateSpellList(actorId, spellList.id, spellLists)
}

export async function saveSpellLists(
    actorId: string,
    spellLists: SpellList[],
): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) {
        throw new Error(`Actor with ID ${actorId} not found`) // TODO: i18n
    }

    await actor.setFlag(MODULE_ID, SPELL_LISTS_FLAG, spellLists)
}

export async function getSpellLists(actorId: string): Promise<SpellList[]> {
    const actor = game.actors?.get(actorId)
    if (!actor) {
        throw new Error(`Actor with ID ${actorId} not found`) // TODO: i18n
    }

    const spellLists = actor.getFlag(MODULE_ID, SPELL_LISTS_FLAG) as
        | SpellList[]
        | undefined

    return spellLists || []
}

export async function updateSpellList(
    actorId: string,
    spellListId: string,
    updatedList: Partial<SpellList>,
): Promise<void> {
    const spellLists = await getSpellLists(actorId)
    const index = spellLists.findIndex((list) => list.id === spellListId)
    if (index === -1) {
        throw new Error(
            `Spell list with ID ${updatedList.id} not found for actor ${actorId}`, // TODO: i18n
        )
    }

    Object.entries(updatedList).forEach(([key, value]) => {
        ;(spellLists[index] as any)[key] = value
    })

    await saveSpellLists(actorId, spellLists)
}

export async function deleteSpellList(
    actorId: string,
    listId: string,
): Promise<void> {
    if (listId === DEFAULT_SPELL_LIST_ID) {
        throw new Error('Cannot delete the default spell list') // TODO: i18n
    }

    const spellLists = await getSpellLists(actorId)
    const listToDelete = spellLists.find((list) => list.id === listId)
    if (!listToDelete) {
        throw new Error(
            `Spell list with ID ${listId} not found for actor ${actorId}`, // TODO: i18n
        )
    }

    const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: 'Delete Spell List' }, // TODO: i18n
        content: '<p>Are you sure you want to delete this spell list?</p>', // TODO: i18n
    })
    if (!confirmed) {
        return
    }

    const updatedLists = spellLists.filter((list) => list.id !== listId)

    await activateSpellList(actorId, DEFAULT_SPELL_LIST_ID, updatedLists)
}

export async function activateSpellList(
    actorId: string,
    listId: string,
    spellLists: SpellList[],
): Promise<void> {
    spellLists.forEach((list) => {
        list.isActive = list.id === listId
    })

    await saveSpellLists(actorId, spellLists)

    const activeSpellList = await getActiveSpellList(actorId)
    if (!activeSpellList) {
        return
    }

    // TODO: Separate foundry access logic into service (e.g. interaction with Actor or Spell entities)
    const actor = game.actors?.get(actorId)
    if (!actor) {
        return
    }

    const currentlyPreparedSpells = actor.items
        .filter((item) => {
            if (item.type !== 'spell') {
                return false
            }

            const spell = item as SpellItem
            return (
                spell.system.level > 0 &&
                spell.system.prepared === SpellPreparationMode.PREPARED
            )
        })
        .map((item) => item.id)

    const spellsToPrepare = activeSpellList.spells.filter(
        (spell) => !currentlyPreparedSpells.includes(spell.id),
    )

    const spellsToUnprepare = currentlyPreparedSpells.filter(
        (spellId) =>
            !activeSpellList.spells.some((spell) => spell.id === spellId),
    )

    const updates = [
        ...spellsToPrepare.map((spell) => ({
            _id: spell.id,
            'system.prepared': SpellPreparationMode.PREPARED,
            ignoreSpellLimitCheck: true, // TODO: Add constant?
        })),
        ...spellsToUnprepare.map((spellId) => ({
            _id: spellId,
            'system.prepared': SpellPreparationMode.NOT_PREPARED,
            ignoreSpellLimitCheck: true, // TODO: Add constant?
        })),
    ]

    await actor.updateEmbeddedDocuments('Item', updates)

    if (spellsToPrepare.length > 0) {
        // TODO: Extract to Foundry layer
        const actorSheet = actor.sheet?.element as unknown as HTMLElement
        const filter = actorSheet.querySelector(
            'item-list-controls[for=spells]',
        ) as FilterListControls
        filter.state.properties = new Set(
            activeSpellList.id === DEFAULT_SPELL_LIST_ID ? [] : ['prepared'],
        )
        filter._applyFilters()
    }
}

export async function addToSpellList(
    actorId: string,
    spells: SpellListEntry[],
): Promise<void> {
    const spellLists = await getSpellLists(actorId)
    const activeList = await getActiveSpellList(actorId)
    if (!activeList) {
        throw new Error(
            `No active spell list found for actor ${actorId}`, // TODO: i18n
        )
    }

    activeList.spells = [
        ...activeList.spells,
        ...spells.filter(
            (spell) => !activeList.spells.some((s) => s.id === spell.id),
        ),
    ]

    await saveSpellLists(actorId, spellLists)
}

export async function removeFromSpellList(
    actorId: string,
    spellId: string,
): Promise<void> {
    const spellLists = await getSpellLists(actorId)
    const activeList = await getActiveSpellList(actorId)
    if (!activeList) {
        throw new Error(
            `No active spell list found for actor ${actorId}`, // TODO: i18n
        )
    }

    const index = activeList.spells.findIndex((s) => s.id === spellId)
    if (index !== -1) {
        activeList.spells.splice(index, 1)
        await saveSpellLists(actorId, spellLists)
    }
}

export async function removeFromAllSpellLists(
    actorId: string,
    spellId: string,
): Promise<void> {
    const spellLists = await getSpellLists(actorId)
    let modified = false

    spellLists.forEach((list) => {
        const index = list.spells.findIndex((s) => s.id === spellId)
        if (index !== -1) {
            list.spells.splice(index, 1)
            modified = true
        }
    })

    if (modified) {
        await saveSpellLists(actorId, spellLists)
    }
}

export async function canPrepareSpells(actorId: string): Promise<boolean> {
    const maxPreparedSpells = await getMaxPreparedSpells(actorId)

    return !!Object.keys(maxPreparedSpells).length
}

export async function initializeDefaultSpellList(
    actorId: string,
): Promise<void> {
    // TODO: Extract into Foundry data access layer & deduplicate
    const currentlyPreparedSpells =
        game.actors
            ?.get(actorId)
            ?.items.filter((item) => {
                if (item.type !== 'spell') {
                    return false
                }

                const spell = item as SpellItem
                return (
                    spell.system.level > 0 &&
                    spell.system.prepared === SpellPreparationMode.PREPARED
                )
            })
            .map((item) => ({
                id: item.id,
                sourceClass: (item as SpellItem).system.sourceClass,
            })) ?? []

    await resetSpellLists(actorId)
    const activeSpellList = await getActiveSpellList(actorId)
    if (activeSpellList) {
        return
    }

    await addToSpellList(actorId, currentlyPreparedSpells)
}

export async function getActiveSpellList(
    actorId: string,
): Promise<SpellList | undefined> {
    const spellLists = await getSpellLists(actorId)

    return spellLists.find((list) => list.isActive)
}

export async function resetSpellListsForAllActors(): Promise<void> {
    const characters = game.actors?.filter(
        (actor) => actor.type === 'character',
    )

    await Promise.all(
        characters.map((character) => resetSpellLists(character._id!)),
    )
}

export async function resetSpellLists(actorId: string): Promise<void> {
    const actorCanPrepareSpells = await canPrepareSpells(actorId)

    if (!actorCanPrepareSpells) {
        await clearSpellLists(actorId)
        return
    }

    const spellLists: SpellList[] = []
    const defaultList: SpellList = {
        name: 'Default', // TODO: i18n
        id: DEFAULT_SPELL_LIST_ID,
        isActive: true,
        spells: [],
    }
    spellLists.push(defaultList)

    await saveSpellLists(actorId, spellLists)

    // TODO: Extract into Foundry data access layer
    const actor = game.actors?.get(actorId)
    if (!actor) {
        throw new Error(`Actor with ID ${actorId} not found`) // TODO: i18n
    }

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

// TODO: Extract into Foundry access layer
export async function getMaxPreparedSpells(
    actorId: string,
): Promise<Record<string, number>> {
    const actor = game.actors?.get(actorId)
    if (!actor) {
        throw new Error(`Actor with ID ${actorId} not found`) // TODO: i18n
    }

    const classes = actor.items.filter(
        (item) => item.type === 'class',
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

async function clearSpellLists(actorId: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) {
        throw new Error(`Actor with ID ${actorId} not found`) // TODO: i18n
    }

    await actor.setFlag(MODULE_ID, `-=${SPELL_LISTS_FLAG}`, null)
}

function toSnakeCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
}

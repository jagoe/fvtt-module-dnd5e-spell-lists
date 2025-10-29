import { MODULE_ID } from '../constants.ts'
import { SpellList } from '../models/spellList.ts'

export const DEFAULT_SPELL_LIST_ID = 'default'

const SPELL_LISTS_FLAG = 'spellLists'

export function createEmptySpellList(): SpellList {
    return {
        name: '',
        id: '',
        isActive: false,
    }
}

export async function saveSpellList(
    actorId: string,
    spellList: SpellList,
): Promise<void> {
    spellList.id = toSnakeCase(spellList.name)
    await makeUnique(actorId, spellList)

    const spellLists = await getSpellLists(actorId)
    const existingIndex = spellLists.findIndex(
        (list) => list.id === spellList.id,
    )
    if (existingIndex !== -1) {
        spellLists[existingIndex] = spellList
    } else {
        spellLists.push(spellList)
    }

    await activateSpellList(spellList.id, spellLists)
    await saveSpellLists(actorId, spellLists)
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

    await activateSpellList(DEFAULT_SPELL_LIST_ID, updatedLists)
    await saveSpellLists(actorId, updatedLists)
}

export async function activateSpellList(
    listId: string,
    spellLists: SpellList[],
): Promise<void> {
    spellLists.forEach((list) => {
        list.isActive = list.id === listId
    })
}

function toSnakeCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
}

async function makeUnique(
    actorId: string,
    spellList: SpellList,
): Promise<void> {
    const spellLists = await getSpellLists(actorId)
    const baseId = spellList.id
    const highestCount =
        spellLists.reduce((acc, list) => {
            const regex = new RegExp(`^${baseId}_(\\d+)$`)
            const match = list.id.match(regex)
            if (!match) {
                return acc
            }

            const count = parseInt(match[1], 10)
            return Math.max(acc, count)
        }, 0) || 1

    spellList.id = `${baseId}_${highestCount + 1}`
}

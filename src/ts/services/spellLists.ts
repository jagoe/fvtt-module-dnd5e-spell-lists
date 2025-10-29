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

    await setActive(actorId, spellList.id)

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

export async function deleteSpellList(
    actorId: string,
    listId: string,
): Promise<void> {
    if (listId === DEFAULT_SPELL_LIST_ID) {
        throw new Error('Cannot delete the default spell list') // TODO: i18n
    }

    const spellLists = await getSpellLists(actorId)
    const updatedLists = spellLists.filter((list) => list.id !== listId)
    await saveSpellLists(actorId, updatedLists)
}

export async function setActive(
    actorId: string,
    listId: string,
): Promise<void> {
    const spellLists = await getSpellLists(actorId)
    spellLists.forEach((list) => {
        list.isActive = list.id === listId
    })

    await saveSpellLists(actorId, spellLists)
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
    const entriesWithBaseIdCount = spellLists.filter(
        (list) => list.id === baseId || list.id.startsWith(`${baseId}_`),
    ).length

    spellList.id = `${baseId}_${entriesWithBaseIdCount}`
}

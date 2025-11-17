import {
    DEFAULT_SPELL_LIST_ID,
    SPELL_LISTS_STORE_PROPERTY,
    SpellFilterCategories,
    SpellSortCategories,
} from '../../constants.ts'
import { SpellList, SpellListEntry } from '../../models/spellList.ts'
import { actors } from '../foundry/actors.ts'
import { localize } from '../foundry/i18n.ts'
import { storage } from '../foundry/storage.ts'
import { deepClone, createId } from '../foundry/utils.ts'

export class SpellListRepository {
    private _actor: Actor = null!

    protected static _repoByActor: Record<string, SpellListRepository> = {}

    public static forActor(actorId: string): SpellListRepository {
        if (!!this._repoByActor[actorId]) {
            return this._repoByActor[actorId]
        }

        const repo = new SpellListRepository()
        repo._actor = actors.get(actorId)

        this._repoByActor[actorId] = repo

        return repo
    }

    public static canDeleteSpellList(listId: string): boolean {
        return listId !== DEFAULT_SPELL_LIST_ID
    }

    public async create(
        spellList: Partial<Omit<SpellList, 'id' | 'isActive'>>,
    ): Promise<SpellList> {
        const defaultProperties: SpellList = {
            id: '',
            name: '',
            isActive: false,
            spells: [],
            displayOptions: {
                filter: [SpellFilterCategories.Prepared],
                sort: SpellSortCategories.Priority,
            },
        }

        const newSpellList = Object.assign(defaultProperties, spellList, {
            id: createId(),
        })

        const spellLists = await this.fetch()
        const updated = [...spellLists, newSpellList]

        await this.save(updated)

        return newSpellList
    }

    public async get(spellListId: string): Promise<SpellList> {
        const spellLists = await this.fetch()
        const spellList = spellLists.find((list) => list.id === spellListId)

        if (!spellList) {
            throw new Error(
                `Spell list with ID ${spellListId} not found for actor ${this._actor.id}`,
            )
        }

        return { ...spellList }
    }

    public getAll(): Promise<SpellList[]> {
        return this.fetch()
    }

    public async getActive(): Promise<SpellList> {
        const spellLists = await this.fetch()
        const active = spellLists.find((list) => list.isActive)

        if (!active) {
            throw new Error(
                `No active spell list found for actor "${this._actor.name}".`,
            )
        }

        return { ...active }
    }

    public async update(
        changes: Partial<SpellList> & { id: string },
    ): Promise<void> {
        const spellList = await this.get(changes.id)

        Object.entries(changes).forEach(([key, value]) => {
            ;(spellList as any)[key] = value
        })

        const spellLists = await this.fetch()
        const existingIndex = spellLists.findIndex(
            (list) => list.id === spellList.id,
        )

        if (existingIndex === -1) {
            throw new Error(
                `Unable to update spell list '${changes.id}': Does not exist.`,
            )
        }

        spellLists.splice(existingIndex, 1, spellList)

        await this.save(spellLists)
    }

    public async delete(listId: string): Promise<void> {
        if (!SpellListRepository.canDeleteSpellList(listId)) {
            throw new Error('Cannot delete the default spell list')
        }

        const listToDelete = await this.get(listId)
        if (!listToDelete) {
            return
        }

        const spellLists = await this.fetch()
        const updatedLists = spellLists.filter((list) => list.id !== listId)

        await this.save(updatedLists)

        if (listToDelete.isActive) {
            await this.activate(DEFAULT_SPELL_LIST_ID)
        }
    }

    public async activate(listId: string): Promise<void> {
        const spellLists = await this.fetch()
        const update = spellLists.map((list) => ({
            ...list,
            isActive: list.id === listId,
        }))

        await this.save(update)

        const activeSpellList = await this.getActive()
        await actors.setPreparedSpells(
            this._actor,
            activeSpellList.spells.map((spell) => spell.id),
        )

        actors.applyFilterAndSorting(this._actor, {
            sort: activeSpellList.displayOptions?.sort,
            filter: {
                properties: new Set(activeSpellList.displayOptions?.filter),
                name: activeSpellList.displayOptions?.search ?? '',
            },
        })
    }

    public async move(
        sourceListId: string,
        relativeTo: 'before' | 'after',
        targetListId: string,
    ): Promise<void> {
        const spellLists = await this.fetch()
        const source = spellLists.find((list) => list.id === sourceListId)
        const target = spellLists.find((list) => list.id === targetListId)

        if (!source || !target) {
            return
        }

        const reordered = spellLists.filter((list) => list !== source)
        const targetIndex =
            reordered.indexOf(target) + (relativeTo === 'before' ? 0 : 1)

        reordered.splice(targetIndex, 0, source)

        await this.save(reordered)
    }

    public async copy(
        spellListId: string,
        newName: string | null,
    ): Promise<void> {
        const spellList = await this.get(spellListId)
        const copy = deepClone(spellList)

        copy.name =
            newName ||
            localize('FSL.names.defaultSpellListCopyName', {
                originalName: spellList.name,
            })

        await this.create(copy)
    }

    public async addSpells(spells: SpellListEntry[]): Promise<void> {
        const activeList = await this.getActive()

        activeList.spells = [
            ...activeList.spells,
            ...spells.filter(
                (spell) => !activeList.spells.some((s) => s.id === spell.id),
            ),
        ]

        await this.update(activeList)
    }

    public async removeSpell(spellId: string): Promise<void> {
        const activeList = await this.getActive()

        const spellIndex = activeList.spells.findIndex((s) => s.id === spellId)

        if (spellIndex === -1) {
            return
        }

        activeList.spells.splice(spellIndex, 1)
        await this.update(activeList)
    }

    public async removeSpellFromAll(spellId: string): Promise<void> {
        let modified = false

        const update = await this.fetch()

        // We want to update all lists at the same time to reduce refresh amount
        update.forEach((list) => {
            const index = list.spells.findIndex((s) => s.id === spellId)
            if (index !== -1) {
                list.spells.splice(index, 1)
                modified = true
            }
        })

        if (modified) {
            await this.save(update)
        }
    }

    public async reset(): Promise<void> {
        const actorCanPrepareSpells = actors.canPrepareSpells(this._actor.id)

        if (!actorCanPrepareSpells) {
            // Can't prepare spells, so we just clear everything and leave it at that
            await this.clear()

            return
        }

        // Can prepare spells, so we actually reset to the default state
        const spellLists: SpellList[] = [
            {
                name: localize('FSL.names.defaultSpellListName'),
                id: DEFAULT_SPELL_LIST_ID,
                isActive: true,
                spells: [],
            },
        ]

        await this.save(spellLists)

        await actors.unprepareAllSpells(this._actor)
    }

    private async clear(): Promise<void> {
        await storage.delete(this._actor, SPELL_LISTS_STORE_PROPERTY)
    }

    private async fetch(): Promise<SpellList[]> {
        const spellLists = await storage.retrieve<SpellList[]>(
            this._actor,
            SPELL_LISTS_STORE_PROPERTY,
        )

        return spellLists || []
    }

    private async save(spellLists: SpellList[]): Promise<void> {
        await storage.store(this._actor, SPELL_LISTS_STORE_PROPERTY, spellLists)
    }
}

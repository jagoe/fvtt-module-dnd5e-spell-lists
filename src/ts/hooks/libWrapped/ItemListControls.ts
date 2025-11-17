import {
    ELEMENT_SELECTOR_SPELL_LIST_CONTROLS,
    SpellSortCategories,
    SYSTEM_FLAG_SPELL_SORT_MODE,
} from '../../constants.ts'
import { SpellListRepository } from '../../services/spellLists/repository.ts'
import { getClosestElement } from '../../util/getClosestElement.ts'
import { log } from '../../util/log.ts'

const sortModes = Object.values(SpellSortCategories)

async function onClearFilters(e: Event): Promise<void> {
    const itemListControls = getClosestElement<ItemListControls>(
        e.target,
        ELEMENT_SELECTOR_SPELL_LIST_CONTROLS,
    )
    if (!itemListControls) {
        return
    }

    log.trace('Clearing filter')

    const actorId = itemListControls.app.options.document.id
    const repo = SpellListRepository.forActor(actorId)
    const activeSpellList = await repo.getActive()

    await repo.update({
        id: activeSpellList.id,
        displayOptions: {
            search: '',
            filter: [],
            sort: sortModes[0],
        },
    })
}

async function onCycleMode(e: Event): Promise<void> {
    const itemListControls = getClosestElement<ItemListControls>(
        e.target,
        ELEMENT_SELECTOR_SPELL_LIST_CONTROLS,
    )
    if (!itemListControls) {
        return
    }

    if (!e.currentTarget) {
        return
    }

    const target = e.currentTarget as HTMLElement

    const { action } = target.dataset
    if (!action || action !== 'sort') {
        return
    }

    const flag = SYSTEM_FLAG_SPELL_SORT_MODE
    const current = game.user.getFlag('dnd5e', flag) as
        | SpellSortCategories
        | undefined
    const currentIndex = current ? sortModes.indexOf(current) : 0
    const next = sortModes[(currentIndex + 1) % sortModes.length]

    log.trace('Cycled sort mode:', next)

    const actorId = itemListControls.app.options.document.id
    const repo = SpellListRepository.forActor(actorId)
    const activeSpellList = await repo.getActive()

    await repo.update({
        id: activeSpellList.id,
        displayOptions: {
            ...(activeSpellList.displayOptions ?? {}),
            sort: next,
        },
    })
}

async function onFilterName(e: Event): Promise<void> {
    const itemListControls = getClosestElement<ItemListControls>(
        e.target,
        ELEMENT_SELECTOR_SPELL_LIST_CONTROLS,
    )
    if (!itemListControls) {
        return
    }

    const searchInput = getClosestElement<HTMLInputElement>(
        e.target,
        `${ELEMENT_SELECTOR_SPELL_LIST_CONTROLS} input`,
    )

    if (!searchInput) {
        return
    }

    log.trace('Filter for name:', searchInput.value)

    const actorId = itemListControls.app.options.document.id
    const repo = SpellListRepository.forActor(actorId)
    const activeSpellList = await repo.getActive()

    await repo.update({
        id: activeSpellList.id,
        displayOptions: {
            ...(activeSpellList.displayOptions ?? {}),
            search: searchInput.value,
        },
    })
}

export const ItemListControls = {
    onClearFilters,
    onCycleMode,
    onFilterName,
}

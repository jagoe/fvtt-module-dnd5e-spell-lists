import { TEMPLATE_PATH } from '../constants.ts'
import { SpellList } from '../models/spellList.ts'
import { log } from '../util/log.ts'
import {
    ContextMenuEntry,
    ContextMenuOptions,
} from '@client/applications/ux/context-menu.mjs'
import {
    copySpellList,
    deleteSpellList,
    moveSpellList,
    updateSpellList,
} from '../services/spellLists.ts'

export async function createOrUpdateSpellListTabs(
    html: HTMLElement,
    actorId: string,
    lists: SpellList[],
): Promise<void> {
    const { spellsTab, spellListsElement } = await addSpellListTabs(
        actorId,
        lists,
        html,
    )

    if (!spellsTab || !spellListsElement) {
        return
    }

    scrollToActiveList(spellListsElement)
    addContextMenu(actorId, spellsTab)
    addDragDrop(actorId, spellListsElement)
}

async function addSpellListTabs(
    actorId: string,
    lists: SpellList[],
    html: HTMLElement,
) {
    const spellsTab = html.querySelector(
        '[data-application-part="spells"]',
    ) as HTMLElement
    const header = spellsTab?.querySelector('.top')

    if (!header) {
        log.error('Could not find spells tab or header element')
        return {}
    }

    const renderedTemplate =
        await foundry.applications.handlebars.renderTemplate(
            `${TEMPLATE_PATH}/spell-lists.hbs`,
            { actorId, lists },
        )

    const spellListsContainer = document.createElement('div')
    spellListsContainer.innerHTML = renderedTemplate
    header.after(spellListsContainer)

    const spellListsElement = spellListsContainer.querySelector(
        '.spell-lists',
    ) as HTMLElement

    return { spellsTab, spellListsElement }
}

function scrollToActiveList(spellListsContainer: HTMLElement) {
    const activeList = spellListsContainer.querySelector(
        '.spell-list.active',
    ) as HTMLElement

    if (activeList) {
        spellListsContainer.scroll({
            left: activeList.offsetLeft - spellListsContainer.offsetLeft,
            behavior: 'instant',
        })
    }
}

// TODO: Extract
export async function promptSpellListName(): Promise<string | null> {
    const data = await (
        foundry.applications.api.DialogV2 as unknown as DialogV2WithInput
    ).input<{ name: string }>({
        window: { title: 'Spell List Name' },
        content: `<input type="text" name="name" placeholder="Enter spell list name" />`,
        ok: {
            label: 'Update',
            icon: 'fa-solid fa-floppy-disk',
        },
    })

    return data?.name || null
}

function addContextMenu(actorId: string, spellsTab: HTMLElement) {
    const contextMenuItems: ContextMenuEntry[] = [
        {
            name: 'Rename Spell List', // TODO: i18n
            icon: '<i class="fas fa-book"></i>',
            callback: async (li: HTMLElement) => {
                const spellListId = li.dataset.listId
                if (!spellListId) {
                    return
                }

                const spellListName = await promptSpellListName()
                if (!spellListName) {
                    return
                }

                updateSpellList(actorId, spellListId, { name: spellListName })
            },
        },
        {
            name: 'Copy Spell List', // TODO: i18n
            icon: '<i class="fas fa-copy"></i>',
            callback: async (li: HTMLElement) => {
                const spellListId = li.dataset.listId
                if (!spellListId) {
                    return
                }

                const spellListName = await promptSpellListName()

                copySpellList(actorId, spellListId, spellListName)
            },
        },
        {
            name: 'Delete Spell List', // TODO: i18n
            icon: '<i class="fas fa-trash"></i>',
            callback: async (li: HTMLElement) => {
                const spellListId = li.dataset.listId
                if (!spellListId) {
                    return
                }

                deleteSpellList(actorId, spellListId)
            },
        },
    ]
    const options: ContextMenuOptions = {
        jQuery: false,
        fixed: true,
    }

    new foundry.applications.ux.ContextMenu(
        spellsTab,
        '.spell-list',
        contextMenuItems,
        options,
    )
}

// TODO: Extract to drag/drop lib

type Centroid = {
    x: number
    y: number
}

type SortableHTMLElement = {
    element: HTMLElement
    centroid: Centroid | null
    distance: number
}

type Intent = 'before' | 'after'

type TransferData = {
    listId: string
}

type DropData = {
    closest: HTMLElement
    intent: Intent
}

function computeCentroid(element: Element): Centroid {
    const rect = element.getBoundingClientRect()
    const viewportX = (rect.left + rect.right) / 2
    const viewportY = (rect.top + rect.bottom) / 2

    return { x: viewportX + window.scrollX, y: viewportY + window.scrollY }
}

function pageDistanceBetweenPointerAndCentroid(
    e: DragEvent,
    centroid: Centroid,
) {
    return Math.hypot(
        centroid.x - (e.clientX + window.scrollX),
        centroid.y - (e.clientY + window.scrollY),
    )
}

function intentFrom(e: DragEvent, centroid: Centroid): Intent {
    return e.clientX + window.scrollX < centroid.x ? 'before' : 'after'
}

function initializeDragData(spellListsContainer: HTMLElement) {
    const tabElements = spellListsContainer.querySelectorAll('[draggable]')
    if (tabElements.length <= 1) {
        // Not enough elements to enable re-ordering
        return []
    }

    const tabs = [...tabElements].map((tab) => ({
        element: tab,
    })) as SortableHTMLElement[]

    return tabs
}

function addDragDrop(actorId: string, spellListsContainer: HTMLElement) {
    const scrollThreshold = 150
    const scrollStep = 100

    let tabs: SortableHTMLElement[] = initializeDragData(spellListsContainer)
    let dropData: DropData | null = null
    let needsToScroll = false

    const scroll = (direction: number) => {
        const scrollX = spellListsContainer.scrollLeft

        spellListsContainer.scrollTo({
            left: scrollX + direction * scrollStep,
            behavior: 'smooth',
        })

        if (needsToScroll) {
            setTimeout(() => scroll(direction), 20)
        }
    }

    spellListsContainer.addEventListener('dragover', (e) => {
        e.preventDefault()

        // Calculate closest drop target
        const byProximity = tabs
            .map((tab) => {
                const centroid = tab.centroid || computeCentroid(tab.element)

                return {
                    ...tab,
                    centroid,
                    distance: pageDistanceBetweenPointerAndCentroid(
                        e,
                        centroid,
                    ),
                }
            })
            .sort((a, b) => a.distance - b.distance)

        const closest = byProximity[0]

        const intent = intentFrom(e, closest.centroid)

        spellListsContainer
            .querySelector('.drop-target')
            ?.classList.remove('drop-target', 'drop-before', 'drop-after')
        closest.element.classList.add('drop-target', `drop-${intent}`)

        dropData = {
            closest: closest.element,
            intent,
        }

        // Calculate need for scrolling
        const rect = spellListsContainer.getBoundingClientRect()
        const leftBorder = rect.left + window.scrollX
        const rightBorder = rect.right + window.scrollX
        const cursorPosition = e.clientX + window.scrollX

        if (cursorPosition - leftBorder < scrollThreshold) {
            needsToScroll = true
            scroll(-1)
        } else if (rightBorder - cursorPosition < scrollThreshold) {
            needsToScroll = true
            scroll(1)
        } else {
            needsToScroll = false
        }
    })

    spellListsContainer.addEventListener('drop', (e) => {
        const transferData = e.dataTransfer?.getData('application/json')
        if (!transferData) {
            return
        }

        if (!dropData) {
            return
        }

        const { listId }: TransferData = JSON.parse(transferData)

        if (!listId) {
            return
        }

        const { closest, intent } = dropData

        const source = spellListsContainer.querySelector(
            `[data-list-id='${listId}']`,
        )

        if (!source) {
            return
        }

        if (closest === source) {
            return
        }

        if (intent === 'before') {
            closest.before(source)
        } else {
            closest.after(source)
        }

        dropData = null

        const targetListId = closest.dataset.listId
        moveSpellList(actorId, listId, intent, targetListId ?? '')
    })

    tabs.forEach(({ element: tab }) => {
        tab.addEventListener('dragstart', (e) => {
            if (!e.dataTransfer) {
                return
            }

            tab.classList.add('dragging')
            e.dataTransfer.setData(
                'application/json',
                JSON.stringify({ listId: tab.dataset.listId }),
            )
        })

        tab.addEventListener('dragend', () => {
            needsToScroll = false

            tab.classList.remove('dragging')

            tabs.forEach((tab) =>
                tab.element.classList.remove(
                    'drop-target',
                    'drop-before',
                    'drop-after',
                ),
            )

            tabs.forEach((tab) => (tab.centroid = null))
        })
    })
}

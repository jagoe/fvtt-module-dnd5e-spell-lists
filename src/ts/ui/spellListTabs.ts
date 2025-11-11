import { TEMPLATE_PATH } from '../constants.ts'
import { SpellList } from '../models/spellList.ts'
import { log } from '../util/log.ts'
import {
    ContextMenuEntry,
    ContextMenuOptions,
} from '@client/applications/ux/context-menu.mjs'
import { localize } from '../services/foundry/i18n.ts'
import { SpellListRepository } from '../services/spellLists/repository.ts'
import { confirm, prompt } from '../services/foundry/ui.ts'
import { addDragDropSort } from './dragDropSort.ts'

export async function createOrUpdateSpellListTabs(
    html: HTMLElement,
    actorId: string,
): Promise<void> {
    const repo = SpellListRepository.forActor(actorId)
    const spellLists = await repo.getAll()

    const createdElements = await addSpellListTabs(actorId, spellLists, html)

    if (!createdElements) {
        return
    }

    const { spellsTab, spellListsElement } = createdElements

    scrollToActiveList(spellListsElement)
    addContextMenu(actorId, spellsTab)
    addDragDropSort(
        spellListsElement,
        (container, data) =>
            container.querySelector(`[data-list-id='${data.identifier}']`),
        (element) => ({ identifier: element.dataset.listId }),
        (sourceListId, targetListId, dropRelation) => {
            const repo = SpellListRepository.forActor(actorId)

            repo.move(sourceListId, dropRelation, targetListId)
        },
    )
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
        return null
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

export async function promptSpellListName(): Promise<string | null> {
    const data = await prompt<{ name: string }>({
        title: 'FSL.ui.dialogs.spellListName.title',
        inputs: [
            {
                name: 'name',
                placeholder: 'FSL.ui.dialogs.spellListName.placeholder',
            },
        ],
        okButton: {
            label: 'FSL.ui.dialogs.save',
            icon: 'floppy-disk',
        },
    })

    return data?.name || null
}

function addContextMenu(actorId: string, spellsTab: HTMLElement) {
    const contextMenuItems: ContextMenuEntry[] = [
        {
            name: localize('FSL.ui.contextMenus.spellList.rename'),
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

                const repo = SpellListRepository.forActor(actorId)
                await repo.update({ id: spellListId, name: spellListName })
            },
        },
        {
            name: localize('FSL.ui.contextMenus.spellList.copy'),
            icon: '<i class="fas fa-copy"></i>',
            callback: async (li: HTMLElement) => {
                const spellListId = li.dataset.listId
                if (!spellListId) {
                    return
                }

                const spellListName = await promptSpellListName()

                const repo = SpellListRepository.forActor(actorId)
                await repo.copy(spellListId, spellListName)
            },
        },
        {
            name: localize('FSL.ui.contextMenus.spellList.delete'),
            icon: '<i class="fas fa-trash"></i>',
            callback: async (li: HTMLElement) => {
                const spellListId = li.dataset.listId
                if (!spellListId) {
                    return
                }

                if (!SpellListRepository.canDeleteSpellList(spellListId)) {
                    foundry.ui.notifications.warn(
                        localize(
                            'FSL.ui.notifications.warn.cannotDeleteDefaultSpellList',
                        ),
                    )

                    return
                }

                const confirmed = await confirm({
                    title: 'FSL.ui.forms.delete.title',
                    content: 'FSL.ui.forms.delete.body',
                })

                if (!confirmed) {
                    return
                }

                const repo = SpellListRepository.forActor(actorId)
                await repo.delete(spellListId)
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

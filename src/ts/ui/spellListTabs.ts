import { TEMPLATE_PATH } from '../constants.ts'
import { SpellList } from '../models/spellList.ts'
import { log } from '../util/log.ts'
import {
    ContextMenuEntry,
    ContextMenuOptions,
} from '@client/applications/ux/context-menu.mjs'
import { deleteSpellList, updateSpellList } from '../services/spellLists.ts'

export async function createOrUpdateSpellListTabs(
    html: HTMLElement,
    actorId: string,
    lists: SpellList[],
): Promise<void> {
    const spellsTab = html.querySelector(
        '[data-application-part="spells"]',
    ) as HTMLElement
    const header = spellsTab?.querySelector('.top')

    if (!header) {
        log.warn('Could not find spells tab or header element')
        return
    }

    const renderedTemplate =
        await foundry.applications.handlebars.renderTemplate(
            `${TEMPLATE_PATH}/spell-lists.hbs`,
            { actorId, lists },
        )

    let spellListsElement = html.querySelector('.spell-lists') as HTMLElement
    if (spellListsElement) {
        spellListsElement.innerHTML = renderedTemplate
    } else {
        spellListsElement = document.createElement('div')
        spellListsElement.innerHTML = renderedTemplate
        header.after(spellListsElement)
    }

    const activeList = spellListsElement.querySelector(
        '.spell-list.active',
    ) as HTMLElement
    if (activeList) {
        spellListsElement.scroll({
            left: activeList.offsetLeft - spellListsElement.offsetLeft,
            behavior: 'instant',
        })
    }

    const contextMenuItems: ContextMenuEntry[] = [
        {
            name: 'Rename Spell List', // TODO: i18n
            icon: '<i class="fas fa-book"></i>',
            callback: async (li: HTMLElement) => {
                const spellListId = li.dataset.listId
                if (!spellListId) {
                    return
                }

                const data = await (
                    foundry.applications.api
                        .DialogV2 as unknown as DialogV2WithInput
                ).input<{ name: string }>({
                    window: { title: 'Spell List Name' },
                    content: `<input type="text" name="name" placeholder="Enter spell list name" />`,
                    ok: {
                        label: 'Update',
                        icon: 'fa-solid fa-floppy-disk',
                    },
                })

                const spellListName = data?.name
                if (!spellListName) {
                    return
                }

                updateSpellList(actorId, spellListId, { name: spellListName })
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

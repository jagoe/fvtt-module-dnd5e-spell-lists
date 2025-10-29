import { TEMPLATE_PATH } from '../constants.ts'
import { SpellList } from '../models/spellList.ts'
import { log } from '../util/log.ts'
import {
    ContextMenuEntry,
    ContextMenuOptions,
} from '@client/applications/ux/context-menu.mjs'
import { deleteSpellList } from '../services/spellLists.ts'

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

    const activeList = spellListsElement.querySelector('.spell-list.active')
    activeList?.scrollIntoView({
        behavior: 'instant',
        block: 'center',
        inline: 'center',
    })

    const contextMenuItems: ContextMenuEntry[] = [
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

import { TEMPLATE_PATH } from '../constants.ts'
import { SpellList } from '../models/spellList.ts'
import { log } from '../util/log.ts'

export async function createOrUpdateSpellListTabs(
    html: HTMLElement,
    actorId: string,
    lists: SpellList[],
): Promise<void> {
    const spellsTab = html.querySelector('[data-application-part="spells"]')
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

    let spellListsElement = html.querySelector('.spell-lists')
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
}

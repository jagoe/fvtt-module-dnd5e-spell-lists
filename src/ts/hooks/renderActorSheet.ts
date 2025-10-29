import { ApplicationRenderOptions } from '@client/applications/_module.mjs'
import { log } from '../util/log.ts'
import { Listener } from './index.ts'
import { ApplicationV2 } from '@client/applications/api/_module.mjs'
import { TEMPLATE_PATH } from '../constants.ts'

const RenderActorSheet: Listener = {
    listen(): void {
        Hooks.on(
            'renderCharacterActorSheet',
            async (
                _app: ApplicationV2,
                html: HTMLElement,
                _data: unknown,
                _renderOptions: ApplicationRenderOptions,
            ) => {
                const spellsTab = html.querySelector(
                    '[data-application-part="spells"]',
                )
                const header = spellsTab?.querySelector('.top')

                if (!header) {
                    log.warn('Could not find spells tab or header element')
                    return
                }

                // TODO: Get stored spell lists
                // TODO: When saving, auto-create id by snakecasing name and ensuring uniqueness
                const lists = [
                    {
                        name: 'Default',
                        id: 'default',
                        order: 0,
                        isActive: true,
                    },
                    {
                        name: 'Aggressive',
                        id: 'aggressive',
                        order: 1,
                        isActive: false,
                    },
                    {
                        name: 'Support',
                        id: 'support',
                        order: 2,
                        isActive: false,
                    },
                ].sort((a, b) => a.order - b.order)

                const renderedTemplate =
                    await foundry.applications.handlebars.renderTemplate(
                        `${TEMPLATE_PATH}/spell-lists.hbs`,
                        { lists },
                    )

                header.insertAdjacentHTML('afterend', renderedTemplate)
            },
        )
    },
}

export { RenderActorSheet }

import { MODULE_ID } from '../../constants.ts'
import { Listener } from '../index.ts'
import { libWrapper } from '@static/lib/shim.ts'
import { Item } from '../libWrapped/Item.ts'
import { ItemListControls } from '../libWrapped/ItemListControls.ts'

export const Setup: Listener = {
    listen(): void {
        Hooks.once('setup', () => {
            libWrapper.register(
                MODULE_ID,
                'Item.prototype._preUpdate',
                Item.preUpdateItem,
            )

            libWrapper.register(
                MODULE_ID,
                'dnd5e.applications.components.ItemListControlsElement.prototype._onClearFilters',
                ItemListControls.onClearFilters,
                'LISTENER',
            )

            libWrapper.register(
                MODULE_ID,
                'dnd5e.applications.components.ItemListControlsElement.prototype._onCycleMode',
                ItemListControls.onCycleMode,
                'LISTENER',
            )

            libWrapper.register(
                MODULE_ID,
                'dnd5e.applications.components.ItemListControlsElement.prototype._onFilterName',
                ItemListControls.onFilterName,
                'LISTENER',
            )
        })
    },
}

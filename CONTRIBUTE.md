# Contribution Guide

## `dnd5e`-internal functionality

This module has to use some functionality internal to the D&D 5e system for Foundry VTT. For that reason,
these details should be checked even for minor version changes:

* `dnd5e.applications.components.ItemListControlsElement.prototype._onClearFilters` is still used to clear filters
* `dnd5e.applications.components.ItemListControlsElement.prototype._onCycleMode` is still used to cycle the sort mode
* `dnd5e.applications.components.ItemListControlsElement.prototype._onFilterName` is still used when the filtered name gets updated
* The `SpellSortCategories` are still correct and their order is still
  1. `Alphabetically` (`a`)
  2. `Priority` (`p`)
  3. `Manually` (`m`)
* `sheetPrefs.character.tabs.spells.sort` is still the system's user flag for the spell tab sort mode
* `item-list-controls[for=spells]` is still the selector for the spell tab's `ItemListControls` element
* The `SpellPreparationMode`s are still
  * `NOT_PREPARED`: `0`,
  * `PREPARED`: `1`,
  * `ALWAYS_PREPARED`: `2`,
* `prepared` is still the spell filter mode value for prepared spells

# FoundryVTT Module &mdash; Spell Lists for D&D 5e

__Spell Lists for D&D 5e__ is a FoundryVTT module based on [DFreds Module Template TS](https://github.com/DFreds/dfreds-module-template-ts).

The module allows D&D5e players to manage multiple spell lists for their spell-slinging characters, so they can now easily switch between their
favorite spell sets depending on environment, situation, plans, and so on.

The module uses system information to automatically determine if a character can prepare spells
([if not perfectly](#but-sorcerers-cant-prepare-spells)) and provides a (hopefully) non-intrusive UI to manage and switch between spell lists.

## Features

### Create new spell lists

Sort and filter for prepared spells by default

### Rename spell lists

### Delete spell lists

### Copy spell lists

### Re-order spell lists

### Respect maximum number of prepared spells

### Remember filtering and sorting for spell lists

## Caveats

### But Sorcerers can't prepare spells!

Sadly, the Foundry VTT system for D&D 5e uses the same fields to determine the number of spells a character can learn and those they can prepare.\
To be a bit more future-proof and work with custom classes, the module uses those fields to determine whether a character can prepare spells and
I decided that I prefered that feature over a hard-coded restriction to the "correct" classes.

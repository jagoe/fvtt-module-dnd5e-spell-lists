import type { DatabaseUpdateOperation } from '@common/abstract/_module.mjs'
import { items } from '../../services/foundry/items.ts'

async function preUpdateItem(
    this: SpellItem,
    wrapped: (
        changes: Partial<SpellItem>,
        options: DatabaseUpdateOperation<Item>,
        user: User,
    ) => Promise<boolean | undefined>,
    changes: Partial<SpellItem>,
    options: DatabaseUpdateOperation<Item>,
    user: User,
): Promise<boolean | undefined> {
    const next = () => wrapped(changes, options, user)

    if (await items.exceedsPreparedSpellLimit(this, changes)) {
        return false
    }

    return next()
}

export const Item = {
    preUpdateItem,
}

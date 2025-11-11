import { ClientDocument } from '@client/documents/abstract/_module.mjs'
import { MODULE_ID } from '../../constants.ts'

async function store<T>(
    entity: ClientDocument,
    property: string,
    data: T,
): Promise<void> {
    await entity.setFlag(MODULE_ID, property, data)
}

async function retrieve<T>(
    entity: ClientDocument,
    property: string,
): Promise<T | undefined> {
    const data = (await entity.getFlag(MODULE_ID, property)) as T

    return data
}

async function remove(entity: ClientDocument, property: string): Promise<void> {
    await entity.unsetFlag(MODULE_ID, property)
}

export const storage = {
    store,
    retrieve,
    delete: remove,
}

export function createId(length: number = 16): string {
    return foundry.utils.randomID(length)
}

export function deepClone<T>(original: T): T {
    return foundry.utils.deepClone(original)
}

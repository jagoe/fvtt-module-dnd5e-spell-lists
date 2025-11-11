export function localize(
    key: string,
    parameters?: Record<string, Maybe<string | number | boolean>>,
): string {
    if (!parameters) {
        return game.i18n.localize(key)
    }

    return game.i18n.format(key, parameters)
}

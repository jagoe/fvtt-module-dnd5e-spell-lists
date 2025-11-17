export function getClosestElement<T extends Element = HTMLElement>(
    target: EventTarget | null,
    selector: string,
): T | undefined {
    if (!target) {
        return
    }

    const element = target as Element

    const itemListControls = element.closest(selector)
    if (!itemListControls) {
        return
    }

    return itemListControls as T
}

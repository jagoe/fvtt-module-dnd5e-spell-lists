import { log } from '../util/log.ts'

export type DropRelation = 'before' | 'after'

type Centroid = {
    x: number
    y: number
}

type SortableHTMLElement = {
    element: HTMLElement
    centroid: Centroid | null
    distance: number
}

type TransferData = {
    identifier?: string
}

type DropData = {
    closest: HTMLElement
    relation: DropRelation
}

function computeCentroid(element: Element): Centroid {
    const rect = element.getBoundingClientRect()
    const viewportX = (rect.left + rect.right) / 2
    const viewportY = (rect.top + rect.bottom) / 2

    return { x: viewportX + window.scrollX, y: viewportY + window.scrollY }
}

function pageDistanceBetweenPointerAndCentroid(
    e: DragEvent,
    centroid: Centroid,
) {
    return Math.hypot(
        centroid.x - (e.clientX + window.scrollX),
        centroid.y - (e.clientY + window.scrollY),
    )
}

function getDropRelationTo(e: DragEvent, centroid: Centroid): DropRelation {
    return e.clientX + window.scrollX < centroid.x ? 'before' : 'after'
}

function initializeDragData(container: HTMLElement) {
    const tabElements = container.querySelectorAll('[draggable]')
    if (tabElements.length <= 1) {
        // Not enough elements to enable re-ordering
        return []
    }

    const tabs = [...tabElements].map((tab) => ({
        element: tab,
    })) as SortableHTMLElement[]

    return tabs
}

export function addDragDropSort(
    container: HTMLElement,
    identifyElement: (
        container: HTMLElement,
        data: TransferData,
    ) => HTMLElement | null,
    getTransferData: (element: HTMLElement) => TransferData,
    onSort: (
        source: string,
        target: string,
        dropRelation: DropRelation,
    ) => void,
): void {
    const scrollThreshold = 150
    const scrollStep = 100

    let tabs: SortableHTMLElement[] = initializeDragData(container)
    let dropData: DropData | null = null
    let needsToScroll = false

    const scroll = (direction: number) => {
        const scrollX = container.scrollLeft

        container.scrollTo({
            left: scrollX + direction * scrollStep,
            behavior: 'smooth',
        })

        if (needsToScroll) {
            setTimeout(() => scroll(direction), 20)
        }
    }

    container.addEventListener('dragover', (e) => {
        e.preventDefault()

        // Calculate closest drop target
        const byProximity = tabs
            .map((tab) => {
                const centroid = tab.centroid || computeCentroid(tab.element)

                return {
                    ...tab,
                    centroid,
                    distance: pageDistanceBetweenPointerAndCentroid(
                        e,
                        centroid,
                    ),
                }
            })
            .sort((a, b) => a.distance - b.distance)

        const closest = byProximity[0]

        const relation = getDropRelationTo(e, closest.centroid)

        container
            .querySelector('.drop-target')
            ?.classList.remove('drop-target', 'drop-before', 'drop-after')
        closest.element.classList.add('drop-target', `drop-${relation}`)

        dropData = {
            closest: closest.element,
            relation: relation,
        }

        // Calculate need for scrolling
        const rect = container.getBoundingClientRect()
        const leftBorder = rect.left + window.scrollX
        const rightBorder = rect.right + window.scrollX
        const cursorPosition = e.clientX + window.scrollX

        if (cursorPosition - leftBorder < scrollThreshold) {
            needsToScroll = true
            scroll(-1)
        } else if (rightBorder - cursorPosition < scrollThreshold) {
            needsToScroll = true
            scroll(1)
        } else {
            needsToScroll = false
        }
    })

    container.addEventListener('drop', (e) => {
        const transferDataRaw = e.dataTransfer?.getData('application/json')
        if (!transferDataRaw) {
            return
        }

        if (!dropData) {
            return
        }

        const transferData: TransferData = JSON.parse(transferDataRaw)

        if (!transferData) {
            return
        }

        const { closest, relation } = dropData

        const source = identifyElement(container, transferData)

        if (!source) {
            return
        }

        if (closest === source) {
            return
        }

        if (relation === 'before') {
            closest.before(source)
        } else {
            closest.after(source)
        }

        dropData = null

        const sourceId = transferData.identifier
        const targetId = getTransferData(closest).identifier

        if (!sourceId || !targetId) {
            log.warn('Unable to re-order lists; could not determine list IDs.')
            log.trace({ source, target: closest })

            return
        }

        onSort(sourceId, targetId, relation)
    })

    tabs.forEach(({ element: tab }) => {
        tab.addEventListener('dragstart', (e) => {
            if (!e.dataTransfer) {
                return
            }

            tab.classList.add('dragging')
            e.dataTransfer.setData(
                'application/json',
                JSON.stringify(getTransferData(tab)),
            )
        })

        tab.addEventListener('dragend', () => {
            needsToScroll = false

            tab.classList.remove('dragging')

            tabs.forEach((tab) =>
                tab.element.classList.remove(
                    'drop-target',
                    'drop-before',
                    'drop-after',
                ),
            )

            tabs.forEach((tab) => (tab.centroid = null))
        })
    })
}

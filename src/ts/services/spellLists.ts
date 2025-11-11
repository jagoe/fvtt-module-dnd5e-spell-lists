import { actors } from './foundry/actors.ts'
import { SpellListRepository } from './spellLists/repository.ts'

export async function initializeDefaultSpellList(
    actorId: string,
): Promise<void> {
    const actor = actors.get(actorId)
    const currentlyPreparedSpells = actors
        .getCurrentlyPreparedSpells(actor)
        .map((item) => ({
            id: item.id,
            sourceClass: (item as SpellItem).system.sourceClass,
        }))

    const repo = SpellListRepository.forActor(actorId)

    await repo.reset()
    await repo.addSpells(currentlyPreparedSpells)
}

export async function resetEverything(): Promise<void> {
    const characters = actors.getPCs()

    await Promise.all(
        characters.map(async (character) => {
            const repo = SpellListRepository.forActor(character.id)
            await repo.reset()
        }),
    )
}

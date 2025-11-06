import DialogV2Class, {
    DialogV2Button,
    DialogV2Configuration,
    DialogV2WaitOptions,
} from '@client/applications/api/dialog.mjs'
import CombatTrackerConfig from '@client/applications/apps/combat-tracker-config.mjs'
import HeadsUpDisplayContainer from '@client/applications/hud/container.mjs'
import { PlaceableHUDContext } from '@client/applications/hud/placeable-hud.mjs'
import TokenHUD from '@client/applications/hud/token-hud.mjs'
import SettingsConfig from '@client/applications/settings/config.mjs'
import ChatPopout from '@client/applications/sidebar/apps/chat-popout.mjs'
import type ActorDirectory from '@client/applications/sidebar/tabs/actor-directory.d.mts'
import type ChatLog from '@client/applications/sidebar/tabs/chat.d.mts'
import type CombatTracker from '@client/applications/sidebar/tabs/combat-tracker.d.mts'
import type CompendiumDirectory from '@client/applications/sidebar/tabs/compendium-directory.d.mts'
import type ItemDirectory from '@client/applications/sidebar/tabs/item-directory.d.mts'
import type Hotbar from '@client/applications/ui/hotbar.d.mts'
import RegionLegend from '@client/applications/ui/region-legend.mjs'
import SceneControls from '@client/applications/ui/scene-controls.mjs'
import Dialog from '@client/appv1/api/dialog-v1.mjs'
import {
    JournalPageSheet,
    JournalTextPageSheet,
} from '@client/appv1/sheets/journal-page-sheet.mjs'
import type Canvas from '@client/canvas/board.d.mts'
import type EffectsCanvasGroup from '@client/canvas/groups/effects.d.mts'
import type Config from '@client/config.d.mts'
import type Actors from '@client/documents/collections/actors.d.mts'
import type WallDocument from '@client/documents/wall.d.mts'
import type Settings from '@client/applications/sidebar/tabs/settings.d.mts'
import type Game from '@client/game.d.mts'
import type HooksType from '@client/helpers/hooks.d.mts'
import type {
    HookParameters,
    HookParamsCanvasInit,
    HookParamsCanvasReady,
    HookParamsClose,
    HookParamsDropCanvasData,
    HookParamsGetChatLogEntryContext,
    HookParamsGetProseMirrorMenuDropDowns,
    HookParamsGetSceneControlButtons,
    HookParamsHotbarDrop,
    HookParamsI18nInit,
    HookParamsInit,
    HookParamsLightingRefresh,
    HookParamsPreCreateItem,
    HookParamsPreUpdateToken,
    HookParamsReady,
    HookParamsRender,
    HookParamsRenderChatMessageHTML,
    HookParamsSetup,
    HookParamsTargetToken,
    HookParamsUpdate,
    HookParamsUpdateWorldTime,
    HooksParamsPreUpdateCombat,
} from '@client/helpers/hooks.d.mts'
import type { FoundryUI } from '@client/ui.d.mts'
import { ApplicationV2 } from '@client/applications/api/_module.mjs'
import { ApplicationRenderContext } from '@client/applications/_module.mjs'
import type ItemClass from '@client/documents/item.d.mts'
import { SpellPreparationMode } from './constants.ts'
import { DatabaseUpdateOperation } from '@common/abstract/_module.mjs'

type ConfiguredConfig = Config<
    AmbientLightDocument<Scene | null>,
    ActiveEffect<Actor | Item | null>,
    Actor,
    ActorDelta<TokenDocument>,
    ChatLog,
    ChatMessage,
    Combat,
    Combatant<Combat | null, TokenDocument>,
    CombatTracker<Combat | null>,
    CompendiumDirectory,
    Hotbar<Macro>,
    Item,
    Macro,
    MeasuredTemplateDocument,
    RegionDocument,
    RegionBehavior,
    TileDocument<Scene | null>,
    TokenDocument,
    WallDocument<Scene | null>,
    Scene,
    User,
    EffectsCanvasGroup
>

declare global {
    const CONFIG: ConfiguredConfig
    const canvas: Canvas

    type HookParamsPreUpdate<
        T extends foundry.abstract.Document,
        N extends string,
    > = HookParameters<
        `preUpdate${N}`,
        [
            T,
            Record<string, unknown>,
            DatabaseUpdateOperation<T['parent']>,
            string,
        ]
    >

    type CharacterActorSheet = ApplicationV2 & {
        getData(): CharacterActorSheetData
    }

    type CharacterActorSheetData = ApplicationRenderContext & {
        actor?: Actor | null
    }

    class DialogV2WithInput extends DialogV2Class {
        input<T>({
            ok,
            ...options
        }: { ok: Partial<DialogV2Button> } & DeepPartial<
            DialogV2Configuration & DialogV2WaitOptions
        >): Promise<T | null>
    }

    type SpellItem = InstanceType<typeof ItemClass> & {
        system: {
            level: number
            prepared: SpellPreparationMode
            sourceClass: string
        }
        type: 'spell'

        // Hacky solution to prevent a preUpdateItem hook under certain conditions
        ignoreSpellLimitCheck: boolean
    }

    type ClassItem = InstanceType<typeof ItemClass> & {
        system: {
            identifier: string
            spellcasting: {
                preparation?: {
                    formula: string
                    value: number
                    max: number
                }
            }
        }
        type: 'class'
    }

    type FilterListControls = HTMLElement & {
        state: {
            name: string
            properties: Set<string>
        }
        _applyFilters(): void
    }

    class Hooks extends HooksType {
        static on(...args: HookParamsSetup): number
        static on(...args: HookParamsInit): number
        static on(...args: HookParamsReady): number
        static on(...args: HookParamsI18nInit): number
        static on(...args: HookParamsCanvasInit): number
        static on(...args: HookParamsCanvasReady): number
        static on(
            ...args: HookParamsClose<CombatTrackerConfig, 'CombatTrackerConfig'>
        ): number
        static on(...args: HookParamsDropCanvasData): number
        static on(...args: HookParamsGetChatLogEntryContext): number
        static on(...args: HookParamsGetSceneControlButtons): number
        static on(...args: HookParamsHotbarDrop): number
        static on(...args: HookParamsLightingRefresh): number
        static on(...args: HookParamsPreCreateItem): number
        static on(...args: HooksParamsPreUpdateCombat): number
        static on(...args: HookParamsPreUpdateToken): number
        static on(...args: HookParamsRender<ChatLog, 'ChatLog'>): number
        static on(...args: HookParamsRender<ChatPopout, 'ChatPopout'>): number
        static on(
            ...args: HookParamsRender<
                CombatTrackerConfig,
                'CombatTrackerConfig'
            >
        ): number
        static on(
            ...args: HookParamsRender<
                CompendiumDirectory,
                'CompendiumDirectory'
            >
        ): number
        static on(...args: HookParamsRender<Dialog, 'Dialog'>): number
        static on(...args: HookParamsRender<DialogV2Class, 'DialogV2'>): number
        static on(
            ...args: HookParamsRender<
                ActorDirectory<Actor<null>>,
                'ActorDirectory'
            >
        ): number
        static on(
            ...args: HookParamsRender<
                HeadsUpDisplayContainer,
                'HeadsUpDisplayContainer'
            >
        ): number
        static on(
            ...args: HookParamsRender<
                ItemDirectory<Item<null>>,
                'ItemDirectory'
            >
        ): number
        static on(
            ...args: HookParamsRender<SceneControls, 'SceneControls'>
        ): number
        static on(...args: HookParamsRender<Settings, 'Settings'>): number
        static on(
            ...args: HookParamsRender<SettingsConfig, 'SettingsConfig'>
        ): number
        static on(
            ...args: HookParamsRender<TokenHUD, 'TokenHUD', PlaceableHUDContext>
        ): number
        static on(...args: HookParamsRenderChatMessageHTML): number

        static on(
            ...args: HookParamsRender<
                JournalPageSheet<JournalEntryPage<JournalEntry | null>>,
                'JournalPageSheet'
            >
        ): number
        static on(
            ...args: HookParamsRender<
                JournalTextPageSheet<JournalEntryPage<JournalEntry | null>>,
                'JournalTextPageSheet'
            >
        ): number
        static on(
            ...args: HookParamsRender<RegionLegend, 'RegionLegend'>
        ): number
        static on(...args: HookParamsTargetToken): number
        static on(...args: HookParamsPreUpdate<Item, 'Item'>): number
        static on(...args: HookParamsUpdate<Combat, 'Combat'>): number
        static on(...args: HookParamsUpdate<Scene, 'Scene'>): number
        static on(...args: HookParamsUpdate<Item, 'Item'>): number
        static on(...args: HookParamsUpdateWorldTime): number
        static on(...args: HookParamsGetProseMirrorMenuDropDowns): number
        static on(
            ...args: HookParamsRender<
                CharacterActorSheet,
                'CharacterActorSheet'
            >
        ): number

        static on(...args: HookParameters<string, unknown[]>): number
    }

    namespace globalThis {
        const game: Game<
            Actor<null>,
            Actors<Actor<null>>,
            ChatMessage,
            Combat,
            Item<null>,
            Macro,
            Scene,
            User
        >

        const ui: FoundryUI<
            ActorDirectory,
            ItemDirectory,
            ChatLog,
            CompendiumDirectory,
            CombatTracker,
            Hotbar<Macro>
        >
    }

    const BUILD_MODE: 'development' | 'stage' | 'production'
}

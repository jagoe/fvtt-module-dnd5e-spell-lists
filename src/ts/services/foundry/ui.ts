import { localize as localizeString } from './i18n.ts'

type ConfirmationDialogOptions = {
    title: string
    content: string
    localize?: boolean
}

type PromptDialogOptions = {
    title: string
    inputs: PromptInput[]
    okButton: {
        label: string
        icon: 'floppy-disk'
    }
    localize?: boolean
}

type PromptInput = {
    type?: 'text'
    name: string
    placeholder: string
}

export function confirm({
    title,
    content,
    localize = true,
}: ConfirmationDialogOptions): Promise<boolean> {
    return foundry.applications.api.DialogV2.confirm({
        window: {
            title: localize ? localizeString(title) : title,
        },
        content: `<p>${localize ? localizeString(content) : content}</p>`,
    })
}

export function prompt<T>({
    title,
    inputs,
    okButton,
    localize = true,
}: PromptDialogOptions): Promise<T | null> {
    return (
        foundry.applications.api.DialogV2 as unknown as DialogV2WithInput
    ).input<T>({
        window: { title: localize ? localizeString(title) : title },
        content: inputs
            .map(
                (input) =>
                    `<input type="${input.type || 'text'}" name="${input.name}" placeholder="${localize ? localizeString(input.placeholder) : input.placeholder}" />`,
            )
            .join('<br />'),
        ok: {
            label: localize ? localizeString(okButton.label) : okButton.label,
            icon: `fa-solid fa-${okButton.icon}`,
        },
    })
}

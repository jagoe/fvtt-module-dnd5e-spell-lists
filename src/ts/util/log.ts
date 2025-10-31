import { MODULE_NAME } from '../constants.ts'

type logLevel = 'trace' | 'info' | 'warn' | 'error'

function trace(...args: unknown[]): void {
    print('info', ...args)
}

function info(...args: unknown[]): void {
    print('info', ...args)
}

function warn(...args: unknown[]): void {
    print('warn', ...args)
}

function error(...args: unknown[]): void {
    print('error', ...args)
}

function print(level: logLevel = 'info', ...args: unknown[]): void {
    const fn = level === 'info' ? console.log : console[level]

    fn(`Foundry VTT | Module | ${MODULE_NAME} |`, ...args)
}

export const log = {
    trace,
    info,
    warn,
    error,
    print,
}

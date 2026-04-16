import type { Word, UserSettings, Translation } from "./schemas";

type _Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;
type _ToInvoker<T extends (...args: never[]) => unknown> = (
    ...args: Parameters<T>
) => _Promisify<ReturnType<T>>;

const _IPC_HANDLER_LIST = [
    /**
     * Appearance
     */
    ["appearance:expand-island", {} as () => void],
    ["appearance:collapse-island", {} as () => void],

    /**
     * User Settings
     */
    ["user-settings:clear", {} as () => void],
    ["user-settings:list", {} as () => UserSettings],
    ["user-settings:del", {} as (key: keyof UserSettings) => void],
    ["user-settings:get", {} as <K extends keyof UserSettings>(key: K) => UserSettings[K]],
    [
        "user-settings:set",
        {} as <K extends keyof UserSettings>(key: K, value: NonNullable<UserSettings[K]>) => void,
    ],

    /**
     * Translation
     */
    ["translation:clear", {} as () => void],
    ["translation:list", {} as () => Word[]],
    ["translation:del", {} as (key: Word["id"]) => void],
    ["translation:get", {} as (key: Word["id"]) => undefined | Word],
    ["translation:set", {} as (key: Word["id"], value: Word) => void],
    ["translation:query", {} as (sourceText: Translation["sourceText"]) => Promise<Translation | undefined>],
] as const;

const IPC = {
    NAMESPACE: "_@jynxio/buzz",
    CHANNEL: new Map(_IPC_HANDLER_LIST.map((item) => [item[0], item[0]])),
    infer: {} as {
        handler: { [Item in (typeof _IPC_HANDLER_LIST)[number] as Item[0]]: Item[1] };
        invoker: { [Item in (typeof _IPC_HANDLER_LIST)[number] as Item[0]]: _ToInvoker<Item[1]> };
    },
} as const;

export { IPC };

import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { ipcInvoker } from "../_ipc";
import type { UserSettings } from "@/_consts/schemas";

const LIST_KEY = "user-settings:list";

function useUserSettings() {
    const { mutate } = useSWRConfig();

    const list = useSWR(LIST_KEY, () => ipcInvoker["user-settings:list"]());

    type SetProps<T extends keyof UserSettings = keyof UserSettings> = T extends never
        ? never
        : { key: T; value: NonNullable<UserSettings[T]> };
    const set = useSWRMutation(
        "user-settings:set",
        (_key: string, { arg }: { arg: SetProps }) => ipcInvoker["user-settings:set"](arg.key, arg.value),
        { onSuccess: invalidate },
    );

    const del = useSWRMutation(
        "user-settings:del",
        (_key: string, { arg }: { arg: keyof UserSettings }) => ipcInvoker["user-settings:del"](arg),
        { onSuccess: invalidate },
    );

    const clear = useSWRMutation("user-settings:clear", () => ipcInvoker["user-settings:clear"](), {
        onSuccess: invalidate,
    });

    return { list, set, del, clear };

    function invalidate() {
        void mutate(LIST_KEY);
    }
}

export { useUserSettings };

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcInvoker } from "../_ipc";
import type { UserSettings } from "@/_consts/schemas";

const LIST_QUERY_KEYS = [Symbol()];

function useUserSettings() {
    const queryClient = useQueryClient();

    const list = useQuery({
        queryKey: LIST_QUERY_KEYS,
        queryFn: () => ipcInvoker["user-settings:list"](),
    });

    type SetProps<T extends keyof UserSettings = keyof UserSettings> = T extends never
        ? never
        : { key: T; value: NonNullable<UserSettings[T]> };
    const set = useMutation({
        mutationFn: (props: SetProps) => ipcInvoker["user-settings:set"](props.key, props.value),
        onSuccess: invalidate,
    });

    const del = useMutation({
        mutationFn: (key: keyof UserSettings) => ipcInvoker["user-settings:del"](key),
        onSuccess: invalidate,
    });

    const clear = useMutation({
        mutationFn: () => ipcInvoker["user-settings:clear"](),
        onSuccess: invalidate,
    });

    return { list, set, del, clear };

    function invalidate() {
        return queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEYS });
    }
}

export { useUserSettings };

import useSWRMutation from "swr/mutation";
import { ipcInvoker } from "../_ipc";

function useAppearance() {
    const expandIsland = useSWRMutation("appearance:expand-island", () =>
        ipcInvoker["appearance:expand-island"](),
    );

    const collapseIsland = useSWRMutation("appearance:collapse-island", () =>
        ipcInvoker["appearance:collapse-island"](),
    );

    return { expandIsland, collapseIsland };
}

export { useAppearance };

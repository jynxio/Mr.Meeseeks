import { useMutation } from "@tanstack/react-query";
import { ipcInvoker } from "../_ipc";

function useAppearance() {
    const expandIsland = useMutation({
        mutationFn: () => ipcInvoker["appearance:expand-island"](),
    });

    const collapseIsland = useMutation({
        mutationFn: () => ipcInvoker["appearance:collapse-island"](),
    });

    return { expandIsland, collapseIsland };
}

export { useAppearance };

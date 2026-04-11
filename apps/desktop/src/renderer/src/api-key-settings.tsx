import React from "react";
import { ipc } from "./ipc";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function ApiKeySettings() {
    const [password, setPassword] = React.useState("");
    const queryClient = useQueryClient();

    const { mutate: save, isPending: isSaving } = useMutation({
        mutationFn: () => ipc.setApiKey(password),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["get-api-key"] }),
    });

    const { mutate: del, isPending: isDeleting } = useMutation({
        mutationFn: () => ipc.deleteApiKey(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["get-api-key"] }),
    });

    const isDisabled = isSaving || isDeleting;

    return (
        <div>
            <form onSubmit={onSubmit}>
                <input
                    type="password"
                    value={password}
                    disabled={isDisabled}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <button type="submit" disabled={isDisabled}>
                    Save
                </button>
            </form>

            <button disabled={isDisabled} onClick={() => del()}>
                Delete
            </button>
        </div>
    );

    function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (password.trim()) save();
    }
}

export { ApiKeySettings };

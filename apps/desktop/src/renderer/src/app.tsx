import React from "react";
import { ipc } from "./ipc";
import { useQuery } from "@tanstack/react-query";
import { ApiKeySettings } from "./api-key-settings";

function App() {
    const [txt, setTxt] = React.useState("");
    const [submittedTxt, setSubmittedTxt] = React.useState("");

    const { data: apiKey } = useQuery({
        queryKey: ["get-api-key"],
        queryFn: () => ipc.getApiKey(),
    });

    const { data, status } = useQuery({
        enabled: !!submittedTxt,
        queryKey: ["translate", submittedTxt],
        queryFn: () => ipc.translate(submittedTxt),
    });

    useExpansion();

    console.log("data: ", data, "apiKey: ", apiKey);

    return (
        <div>
            <ApiKeySettings />

            <hr />

            <form onSubmit={onSubmit}>
                <input
                    disabled={!apiKey}
                    value={txt}
                    onChange={(event) => setTxt(event.target.value)}
                />
            </form>

            <hr />

            <pre>{JSON.stringify({ status, data }, null, 4)}</pre>
        </div>
    );

    function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmittedTxt(txt);
    }
}

function useExpansion() {
    React.useEffect(() => {
        void ipc.expandIsland();
    }, []);
}

export { App };

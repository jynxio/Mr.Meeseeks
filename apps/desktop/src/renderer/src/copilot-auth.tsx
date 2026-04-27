import { useCopilotAuth } from "../_hooks/use-copilot-auth";

function CopilotAuth() {
    const [snapshot, send] = useCopilotAuth();

    return (
        <div>
            <button onClick={() => send({ type: "sign-in" })}>Sign In</button>

            <pre>State: {snapshot.value}</pre>
            <pre>Context: {JSON.stringify(snapshot.context, null, 2)}</pre>
        </div>
    );
}

export { CopilotAuth };

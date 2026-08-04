import { useChatGPTAuth } from "../_hooks/use-chatgpt-auth";

function ChatGPTAuth() {
    const [snapshot, send] = useChatGPTAuth();

    return (
        <div>
            <button onClick={() => send({ type: "sign-in" })}>Sign In ChatGPT</button>

            <pre>State: {snapshot.value}</pre>
            <pre>Context: {JSON.stringify(snapshot.context, null, 2)}</pre>
        </div>
    );
}

export { ChatGPTAuth };

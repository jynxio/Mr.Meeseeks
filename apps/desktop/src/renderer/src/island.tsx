import { ipcInvoker } from "../_ipc";

function Island() {
    return <button onClick={() => void ipcInvoker["settings:open"]()}>Settings</button>;
}

export { Island };

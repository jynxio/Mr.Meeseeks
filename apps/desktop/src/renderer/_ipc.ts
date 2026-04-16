import { IPC } from "@/_consts";

const ipcInvoker = window[IPC.NAMESPACE] as typeof IPC.infer.invoker;

export { ipcInvoker };

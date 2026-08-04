import type { FetchArgs } from "../_misc/types.ts";

import { safe } from "../_misc/safe.ts";
import { sleep } from "../_misc/sleep.ts";
import { toFunction } from "../_misc/to-function.ts";

type RetryOpts = {
    jitter?: boolean;
    retryCount?: number;
    backoffLimit?: number;
    totalTimeout?: number;
    methods?: readonly string[]; // TODO: 类型上穷尽掉
    statusCodes?: readonly number[];
    retryDelay?: number | ((retryCount: number) => number);
};

const DEFAULT_RETRY_OPTS = {
    jitter: true, //// 作用是啥？默认值选 true 合适吗？为啥你（AI）给的默认值是 false？
    retryCount: 1,
    backoffLimit: 30_000,
    totalTimeout: Infinity,
    methods: ["GET", "HEAD"],
    statusCodes: [408, 429, 500, 502, 503, 504],
    retryDelay: (retryCount) => 300 * 2 ** (retryCount - 1),
} satisfies Required<RetryOpts>;

type FetchWithRetry = (fetchArgsFn: () => FetchArgs) => Promise<Response>;

function withRetry(opts: RetryOpts = {}): FetchWithRetry {
    const resolvedOpts = { ...DEFAULT_RETRY_OPTS, ...opts };

    const statusSet = new Set(resolvedOpts.statusCodes);
    const methodSet = new Set(resolvedOpts.methods.map((item) => item.toUpperCase()));

    async function fetchWithRetry(fetchArgsFn: () => FetchArgs): Promise<Response> {
        const startedAt = Date.now();
        const maxRetryCount = resolvedOpts.retryCount;

        for (let attemptCount = 0; ; ) {
            const args = fetchArgsFn();
            const method = getMethod(args).toUpperCase();
            const signal = getSignal(args);

            // TODO: totalTimeout currently stops future retries, but does not abort an in-flight fetch.
            const res = await safe(() => fetch(...args));
            attemptCount++;

            const isSuccess = !!res;
            if (!isSuccess) return; ////

            const isPermittedMethod = methodSet.has(method);
            if (!isPermittedMethod) return res;

            const isPermittedStatus = statusSet.has(res?.status);
            if (!isPermittedStatus) return res;

            const hasExceededMaxCount = attemptCount >= maxRetryCount;
            if (hasExceededMaxCount) return res;

            const delay = getRetryDelay(res, attemptCount, resolvedOpts);

            const canWait = Date.now() - startedAt + delay < resolvedOpts.totalTimeout;
            if (!canWait) return res;

            res.body?.cancel().catch(() => undefined); //// 为啥要 cancel 掉？如果都读了的话，那么 cancel 都没必要吧？为了抑制错误吗？那我要不要提前抑制？
            await sleep(delay, signal);

            //// 原来那个实现的 catch 分分支，开始！
            //// 原来那个实现的 catch 分分支，开始！
            //// 原来那个实现的 catch 分分支，开始！
            //// 原来那个实现的 catch 分分支，开始！
            //// 原来那个实现的 catch 分分支，开始！
        }
    }
}

function getMethod([input, init]: FetchArgs) {
    if (isRequest(input)) return input.method;
    if (init?.method) return init.method;

    return "GET";
}

function getSignal([input, init]: FetchArgs) {
    if (init?.signal) return init.signal;
    if (isRequest(input)) return input.signal;

    return undefined;
}

function isRequest(input: FetchArgs[0]): input is Request {
    return input instanceof Request;
}

function getRetryDelay(res: Response, attemptCount: number, retryOpts: Required<RetryOpts>): number {
    return getServerSideDelay() ?? getClientSideDelay();

    function getClientSideDelay(): number {
        const delay = toFunction(retryOpts.retryDelay)(attemptCount);
        const limitedDelay = Math.min(delay, retryOpts.backoffLimit);
        const coefficient = retryOpts.jitter ? Math.random() : 1;

        return coefficient * limitedDelay;
    }

    function getServerSideDelay(): undefined | number {
        const value = res.headers.get("retry-after");
        if (!value) return;

        // QUESTION: 先判 number，再判 date 这种方式稳健吗？ky 源码怎么写的
        const seconds = Number(value);
        if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

        const date = Date.parse(value);
        if (Number.isFinite(date)) return Math.max(0, date - Date.now());

        return;
    }
}

function parseRetryAfter(value: string | null) {
    if (!value) return undefined;

    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());

    return undefined;
}

function getRetryAfter(res: Response): number | undefined {
    const value = res.headers.get("retry-after");
    if (!value) return;

    // QUESTION: 这个实现稳健吗？服务器是确实这么给 retry after 的吗？ky 和 ofetch 的源码是怎么做的？源码在哪？
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

    // QUESTION: 这个实现稳健吗？服务器是确实这么给 retry after 的吗？ky 和 ofetch 的源码是怎么做的？源码在哪？
    // QUESTION：这个会有时区问题吗？
    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());

    return;
}

function isAbortOrTimeout(err: unknown, signal: AbortSignal | undefined) {
    if (signal?.aborted) return true;
    if (!(err instanceof Error)) return false;

    return err.name === "AbortError" || err.name === "TimeoutError";
}

function cancelBody(res: Response) {
    void res.body?.cancel().catch(() => undefined);
}

export { withRetry };
export type { FetchArgsFactory, FetchWithRetry, RetryOpts };

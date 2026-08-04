import type { Fetch, FetchArgs } from "../_misc/types.ts";

const DEFAULT_METHODS = new Set(["GET", "HEAD"]);
const DEFAULT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const DEFAULT_BACKOFF_LIMIT = 30_000;

type FetchArgsFactory = () => FetchArgs;
type FetchWithRetry = {
    (...args: FetchArgs): Promise<Response>;
    (factory: FetchArgsFactory): Promise<Response>;
};

type RetryOptions = {
    times?: number;
    methods?: readonly string[];
    statusCodes?: readonly number[];
    delay?: number | ((attempt: number) => number);
    backoffLimit?: number;
    jitter?: boolean;
    totalTimeout?: number;
};

function withRetry(fetcher: Fetch = fetch, options: RetryOptions = {}): FetchWithRetry {
    const times = options.times ?? 1;
    const methods = new Set((options.methods ?? DEFAULT_METHODS).map((method) => method.toUpperCase()));
    const statusCodes = new Set(options.statusCodes ?? DEFAULT_STATUS_CODES);
    const backoffLimit = options.backoffLimit ?? DEFAULT_BACKOFF_LIMIT;

    return async (...argsOrFactory: FetchArgs | [FetchArgsFactory]) => {
        const getArgs = toFetchArgsFactory(argsOrFactory);
        const startedAt = Date.now();

        for (let retryCount = 0; ; ) {
            const args = getArgs();
            const method = getMethod(args);
            const signal = getSignal(args);

            try {
                // TODO: totalTimeout currently stops future retries, but does not abort an in-flight fetch.
                const res = await fetcher(...args);
                if (!canRetryMethod(method) || !statusCodes.has(res.status) || retryCount >= times)
                    return res;

                const retryDelay = getRetryDelay(res, retryCount + 1);
                if (!canWait(retryDelay, startedAt)) return res;

                cancelBody(res);
                await sleep(retryDelay, signal);
            } catch (err) {
                if (isAbortOrTimeout(err, signal) || !canRetryMethod(method) || retryCount >= times)
                    throw err;

                const retryDelay = getRetryDelay(undefined, retryCount + 1);
                if (!canWait(retryDelay, startedAt)) throw err;

                await sleep(retryDelay, signal);
            }

            retryCount++;
        }
    };

    function canRetryMethod(method: string) {
        return methods.has(method.toUpperCase());
    }

    function getRetryDelay(res: Response | undefined, attempt: number) {
        const retryAfter = res ? parseRetryAfter(res.headers.get("retry-after")) : undefined;
        const rawDelay = retryAfter ?? getBackoffDelay(attempt);
        const limitedDelay = Math.min(rawDelay, backoffLimit);

        // Retry-After comes from the server, so keep it exact except for backoffLimit.
        if (retryAfter !== undefined) return limitedDelay;

        return options.jitter ? Math.random() * limitedDelay : limitedDelay;
    }

    function getBackoffDelay(attempt: number) {
        if (typeof options.delay === "number") return options.delay;
        if (typeof options.delay === "function") return options.delay(attempt);

        return 300 * 2 ** (attempt - 1);
    }

    function canWait(ms: number, startedAt: number) {
        if (options.totalTimeout === undefined) return true;

        const elapsed = Date.now() - startedAt;
        return elapsed + ms < options.totalTimeout;
    }
}

function toFetchArgsFactory(argsOrFactory: FetchArgs | [FetchArgsFactory]): FetchArgsFactory {
    const [first] = argsOrFactory;

    if (typeof first === "function") return first as FetchArgsFactory;

    return () => argsOrFactory as FetchArgs;
}

function getMethod([input, init]: FetchArgs) {
    if (init?.method) return init.method;
    if (isRequest(input)) return input.method;

    return "GET";
}

function getSignal([input, init]: FetchArgs) {
    if (init?.signal) return init.signal;
    if (isRequest(input)) return input.signal;

    return undefined;
}

function isRequest(input: FetchArgs[0]): input is Request {
    // QUESTION: 为什么需要检查 undefined？只需要 input instanceof Request 就够了，不是吗？
    return typeof Request !== "undefined" && input instanceof Request;
}

function parseRetryAfter(value: string | null) {
    if (!value) return undefined;

    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());

    return undefined;
}

function isAbortOrTimeout(err: unknown, signal: AbortSignal | undefined) {
    if (signal?.aborted) return true;
    if (!(err instanceof Error)) return false;

    return err.name === "AbortError" || err.name === "TimeoutError";
}

function sleep(ms: number, signal: AbortSignal | undefined) {
    if (ms <= 0) return Promise.resolve();
    if (signal?.aborted) return Promise.reject(signal.reason);

    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(done, ms);

        signal?.addEventListener("abort", onAbort, { once: true });

        function done() {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }

        function onAbort() {
            clearTimeout(timeout);
            reject(signal?.reason);
        }
    });
}

function cancelBody(res: Response) {
    void res.body?.cancel().catch(() => undefined);
}

export { withRetry };
export type { FetchArgsFactory, FetchWithRetry, RetryOptions };

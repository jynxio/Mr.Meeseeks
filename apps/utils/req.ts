import type { AuthConfig } from "./auth";
import { resolveAuthHeader } from "./auth";
import { FetchError } from "./http-error";
import type { RetryConfig } from "./retry";
import { resolveRetry } from "./retry";
import type { StandardSchema, InferOutput } from "./standard-schema";
import { parseSchema } from "./standard-schema";

export type RequestContext = {
    url: string;
    method: string;
    headers: Headers;
    body: BodyInit | undefined;
};

export type ResponseContext = {
    response: Response;
    request: RequestContext;
};

export type SuccessContext = {
    data: unknown;
    response: Response;
    request: RequestContext;
};

export type ErrorContext = {
    error: FetchError;
    response: Response | undefined;
    request: RequestContext;
};

export type RetryContext = {
    attempt: number;
    error: FetchError;
    response: Response | undefined;
    request: RequestContext;
};

type Awaitable<T> = T | Promise<T>;

export type Hooks = {
    /** Modify request context before `fetch` is called (add headers, rewrite URL, …). */
    onRequest?: (ctx: RequestContext) => Awaitable<RequestContext | void>;

    /** Inspect / replace the raw `Response` before body parsing. */
    onResponse?: (ctx: ResponseContext) => Awaitable<Response | void>;

    /**
     * Inspect parsed response data. Return a `FetchError` to convert a
     * successful HTTP response into an error result — useful for APIs that
     * return 200 with an error payload.
     */
    transformResponse?: (data: unknown, response: Response) => FetchError | void;

    /** Side-effect fired after a successful result (post-validation). */
    onSuccess?: (ctx: SuccessContext) => Awaitable<void>;

    /** Side-effect fired on every error (network, HTTP, transform, validation). */
    onError?: (ctx: ErrorContext) => Awaitable<void>;

    /** Fired before each retry attempt. Return `false` to abort retrying. */
    onRetry?: (ctx: RetryContext) => Awaitable<boolean | void>;
};

export type ReqConfig = {
    url: string;
    method: "get" | "post" | "put" | "patch" | "delete";
    data?: Record<string, unknown> | FormData | BodyInit;
    params?: Record<string, unknown>;
    baseURL?: string;
    headers?: Record<string, string | undefined>;
    responseType?: "blob" | "arraybuffer";
    /** Standard Schema for runtime response validation + type inference. */
    output?: StandardSchema;
    /** Per-request auth (overrides client-level auth). */
    auth?: AuthConfig;
    /** Per-request retry (overrides client-level retry). */
    retry?: RetryConfig;
    /** Per-request timeout in ms (overrides client-level timeout). */
    timeout?: number;
    /** User-provided abort signal. Takes precedence over `timeout`. */
    signal?: AbortSignal;
};

export type Result<R> = { ok: true; data: R } | { ok: false; error: FetchError };

export type FetchClientConfig = {
    baseURL?: string | (() => string);
    defaultHeaders?: Record<string, string>;
    auth?: AuthConfig;
    retry?: RetryConfig;
    /** Default timeout in ms for every request. */
    timeout?: number;
    hooks?: Hooks;
};

export function serialize(params: Record<string, unknown>): string {
    const parts: string[] = [];

    function encode(prefix: string, value: unknown) {
        if (value == null) return;

        if (Array.isArray(value)) {
            value.forEach((item, i) => encode(`${prefix}[${i}]`, item));
        } else if (typeof value === "object" && !(value instanceof Date)) {
            for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
                encode(`${prefix}[${k}]`, v);
            }
        } else {
            const str =
                value instanceof Date ? value.toISOString() : String(value as string | number | boolean);
            parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(str)}`);
        }
    }

    for (const [key, value] of Object.entries(params)) {
        encode(key, value);
    }

    return parts.join("&");
}

/**
 * Creates a typed request function backed by `fetch`.
 *
 * ```ts
 * import { z } from "zod";
 *
 * const req = createFetchClient({
 *   baseURL: () => `${location.origin}/api`,
 *   auth: { type: "bearer", token: () => tokenStore.accessToken },
 *   retry: { attempts: 2, delay: exponentialDelay() },
 *   hooks: {
 *     onRequest(ctx) { console.log("→", ctx.method, ctx.url); },
 *     transformResponse(data) {
 *       if (hasErrorCode(data)) return new FetchError("API error", { data });
 *     },
 *     onError({ error }) { toast.error(error.message); },
 *   },
 * });
 *
 * // With Standard Schema — return type inferred from schema
 * const result = await req({
 *   method: "get",
 *   url: "/users",
 *   output: z.array(userSchema),
 * });
 * if (result.ok) result.data; // z.infer<typeof userSchema>[]
 *
 * // Without schema — manual generic
 * const result2 = await req<User[]>({ method: "get", url: "/users" });
 * ```
 *
 * The returned promise **always resolves**. Errors are captured as
 * `{ ok: false; error: FetchError }`.
 */
export function createFetchClient(config: FetchClientConfig = {}) {
    const {
        baseURL: cfgBaseURL,
        defaultHeaders = {},
        auth: cfgAuth,
        retry: cfgRetry,
        timeout: cfgTimeout,
        hooks = {},
    } = config;

    function resolveURL(rc: ReqConfig): string {
        const raw = rc.baseURL ?? (typeof cfgBaseURL === "function" ? cfgBaseURL() : cfgBaseURL) ?? "";
        const base = raw.endsWith("/") ? raw : `${raw}/`;
        const url = new URL(rc.url, base);
        if (rc.params) url.search = serialize(rc.params);
        return url.toString();
    }

    function resolveHeaders(rc: ReqConfig): Headers {
        const headers = new Headers(defaultHeaders);
        if (rc.headers) {
            for (const [key, value] of Object.entries(rc.headers)) {
                if (value != null) headers.set(key, value);
            }
        }
        return headers;
    }

    function resolveBody(rc: ReqConfig, headers: Headers): BodyInit | undefined {
        if (rc.method === "get" || rc.data == null) return undefined;

        if (rc.data instanceof FormData) {
            headers.delete("Content-Type");
            return rc.data;
        }

        if (!(typeof rc.data === "object" && !(rc.data instanceof Blob))) {
            return rc.data as BodyInit;
        }

        const ct = headers.get("Content-Type");
        if (ct === "application/x-www-form-urlencoded") {
            return serialize(rc.data as Record<string, unknown>);
        }

        if (!ct) headers.set("Content-Type", "application/json");
        return JSON.stringify(rc.data);
    }

    function resolveTimeout(rc: ReqConfig): {
        signal: AbortSignal | undefined;
        cleanup: () => void;
    } {
        if (rc.signal) return { signal: rc.signal, cleanup: () => {} };

        const ms = rc.timeout ?? cfgTimeout;
        if (!ms) return { signal: undefined, cleanup: () => {} };

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), ms);
        return { signal: controller.signal, cleanup: () => clearTimeout(id) };
    }

    // -- single attempt ----------------------------------------------------

    async function attempt<R>(rc: ReqConfig): Promise<Result<R>> {
        const url = resolveURL(rc);
        const headers = resolveHeaders(rc);
        const body = resolveBody(rc, headers);

        // Auth (client-level, then per-request override)
        const auth = rc.auth ?? cfgAuth;
        if (auth) {
            const value = await resolveAuthHeader(auth);
            if (value) headers.set("Authorization", value);
        }

        let ctx: RequestContext = { url, method: rc.method.toUpperCase(), headers, body };

        // Hook: onRequest
        if (hooks.onRequest) {
            const modified = await hooks.onRequest(ctx);
            if (modified) ctx = modified;
        }

        // Timeout
        const { signal, cleanup } = resolveTimeout(rc);

        let response: Response;
        try {
            response = await fetch(ctx.url, {
                method: ctx.method,
                headers: ctx.headers,
                body: ctx.body,
                signal,
            });
        } catch (e) {
            cleanup();
            const msg =
                e instanceof DOMException && e.name === "AbortError" ? "Request timeout" : "Network error";
            const error = new FetchError(msg, { data: e });
            await hooks.onError?.({ error, response: undefined, request: ctx });
            return { ok: false, error };
        }
        cleanup();

        // Hook: onResponse
        if (hooks.onResponse) {
            const replaced = await hooks.onResponse({ response, request: ctx });
            if (replaced instanceof Response) response = replaced;
        }

        // Non-2xx
        if (!response.ok) {
            let errorData: unknown;
            try {
                errorData = await response.clone().json();
            } catch {
                errorData = await response.text().catch(() => null);
            }
            const error = new FetchError(response.statusText || `HTTP ${response.status}`, {
                status: response.status,
                data: errorData,
            });
            await hooks.onError?.({ error, response, request: ctx });
            return { ok: false, error };
        }

        // Binary
        if (rc.responseType === "blob") return { ok: true, data: (await response.blob()) as R };
        if (rc.responseType === "arraybuffer") return { ok: true, data: (await response.arrayBuffer()) as R };

        // 204
        if (response.status === 204) return { ok: true, data: "" as R };

        // JSON (text fallback)
        const text = await response.text();
        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        // Hook: transformResponse
        if (hooks.transformResponse) {
            const err = hooks.transformResponse(data, response);
            if (err) {
                await hooks.onError?.({ error: err, response, request: ctx });
                return { ok: false, error: err };
            }
        }

        // Standard Schema validation
        if (rc.output) {
            try {
                data = await parseSchema(rc.output, data);
            } catch (e) {
                const error = new FetchError("Response validation failed", { data: e });
                await hooks.onError?.({ error, response, request: ctx });
                return { ok: false, error };
            }
        }

        // Hook: onSuccess
        await hooks.onSuccess?.({ data, response, request: ctx });

        return { ok: true, data: data as R };
    }

    // -- entry with retry --------------------------------------------------

    async function req<S extends StandardSchema>(
        rc: ReqConfig & { output: S },
    ): Promise<Result<InferOutput<S>>>;
    async function req<R = unknown>(rc: ReqConfig): Promise<Result<R>>;
    async function req(rc: ReqConfig): Promise<Result<unknown>> {
        const retryConfig = rc.retry ?? cfgRetry;

        if (!retryConfig) return attempt(rc);

        const { attempts, getDelay, shouldRetry } = resolveRetry(retryConfig);

        let lastResult = await attempt(rc);
        if (lastResult.ok) return lastResult;

        for (let i = 0; i < attempts; i++) {
            if (!(await shouldRetry({ status: lastResult.error.status }))) break;

            const hookResult = await hooks.onRetry?.({
                attempt: i + 1,
                error: lastResult.error,
                response: undefined,
                request: { url: "", method: "", headers: new Headers(), body: undefined },
            });
            if (hookResult === false) break;

            await new Promise<void>((r) => setTimeout(r, getDelay(i)));

            lastResult = await attempt(rc);
            if (lastResult.ok) return lastResult;
        }

        return lastResult;
    }

    return req;
}

export { FetchError, ValidationError } from "./http-error";
export { parseSchema } from "./standard-schema";
export type { StandardSchema, InferOutput } from "./standard-schema";
export type { AuthConfig } from "./auth";
export type { RetryConfig } from "./retry";
export { linearDelay, exponentialDelay, exponentialDelayWithJitter } from "./retry";

type IsPromise<T> = T extends PromiseLike<unknown> ? true : false;
type isAsyncFn<T extends (...args: unknown[]) => unknown> = IsPromise<ReturnType<T>>;

type Promisify<T extends (...args: never[]) => unknown> = (...args: Parameters<T>) => Promise<ReturnType<T>>;

type _AssertUnique<T extends readonly unknown[], Seen extends readonly unknown[] = []> = T extends readonly [
    infer Head,
    ...infer Tail,
]
    ? Head extends Seen[number] | Tail[number]
        ? Readonly<[never, ..._AssertUnique<Tail, [...Seen, Head]>]>
        : Readonly<[Head, ..._AssertUnique<Tail, [...Seen, Head]>]>
    : T;

/**
 * Creates a string tuple, enforcing unique elements at compile time.
 *
 * @example
 * tuple(["a", "b"]) // No Error
 * tuple(["a", "a"]) // Error
 */
function tuple<const T extends readonly string[]>(arr: T & _AssertUnique<T>): T {
    return arr;
}

/**
 * Converts a string tuple into a lookup object where each key maps to itself.
 *
 * @example
 * toLookup(["a", "b"]) // { a: "a", b: "b" }
 */
function toLookup<const T extends readonly string[]>(arr: T & _AssertUnique<T>) {
    return arr.reduce((acc, curr) => ((acc[curr] = curr), acc), {} as { [K in T[number]]: K });
}

/**
 * Wraps an async function
 * Returning `{ ok: true, data }` or `{ ok: false, error }` instead of throwing.
 */
function tryCatch<Args extends unknown[], Data>(fn: (...args: Args) => Promise<Data>) {
    type ResolvedR = { ok: true; data: Data; error?: never };
    type RejectedR = { ok: false; data?: never; error: Error };

    return async function (...args: Args): Promise<ResolvedR | RejectedR> {
        try {
            return { ok: true, data: await fn(...args) };
        } catch (raw) {
            return { ok: false, error: raw instanceof Error ? raw : new Error(String(raw)) };
        }
    };
}

type SafeResult<T> = { ok: true; data: T; error?: never } | { ok: false; data?: never; error: Error };
type TryCatch<T extends (...args: never[]) => Promise<unknown>> = T extends (
    ...args: infer Args
) => Promise<infer Data>
    ? (...args: Args) => Promise<SafeResult<Data>>
    : never;

export { tuple, toLookup, tryCatch };
export type { IsPromise, isAsyncFn, TryCatch, Promisify, SafeResult };

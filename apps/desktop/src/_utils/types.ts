type IsPromise<T> = T extends PromiseLike<unknown> ? true : false;
type isAsyncFn<T extends (...args: unknown[]) => unknown> = IsPromise<ReturnType<T>>;
type SafeIt<T> = { ok: true; data: T; error?: never } | { ok: false; data?: never; error: Error };

export type { IsPromise, isAsyncFn, SafeIt };

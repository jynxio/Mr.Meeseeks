type Fetch = typeof fetch;
type FetchArgs = Parameters<Fetch>;
type Awaitable<T> = T | PromiseLike<T>;

type UnionToIntersection<T> = (T extends unknown ? (arg: T) => void : never) extends (arg: infer I) => void
    ? I
    : never;

export type { Fetch, FetchArgs, Awaitable, UnionToIntersection };

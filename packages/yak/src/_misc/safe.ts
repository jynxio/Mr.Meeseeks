function safe<R>(fn: (...args: never[]) => Promise<R>): Promise<R | undefined>;
function safe<R, F>(fn: (...args: never[]) => Promise<R>, fallback?: F): Promise<R | F>;

function safe<R>(fn: (...args: never[]) => R): R | undefined;
function safe<R, F>(fn: (...args: never[]) => R, fallback?: F): R | F;

function safe<R, F>(
    fn: (...args: never[]) => R | Promise<R>,
    fallback?: F,
): Promise<R | F | undefined> | (R | F | undefined) {
    try {
        const res = fn();
        const isPromise = res instanceof Promise;

        return isPromise ? res.catch(() => fallback) : res;
    } catch {
        return fallback;
    }
}

export { safe };

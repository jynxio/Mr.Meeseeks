async function timeOut<T>(task: Promise<T>, ms: number): Promise<T | undefined>;
async function timeOut<T, F>(task: Promise<T>, ms: number, fallback: F): Promise<T | F>;
async function timeOut<T, F>(task: Promise<T>, ms: number, fallback?: F): Promise<T | F | undefined> {
    const tag = Symbol();
    const timer = Promise.withResolvers<typeof tag>();
    const timerId = setTimeout(() => timer.resolve(tag), ms);
    const res = await Promise.race([task, timer.promise]);

    clearTimeout(timerId);

    return res === tag ? fallback : res;
}

export { timeOut };

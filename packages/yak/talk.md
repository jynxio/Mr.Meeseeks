## 计划

## 错误处理策略

？ statusError: () => Promise<unknown | undefined>; 的类型

## use

## 测试 SSR

允许用户代理掉 fetch：

const api = createYak({
    fetch: async (input, init) => {
        console.log(input);
        return fetch(input, init);
    },
});

## 重试策略

method：哪些 HTTP method 可以重试。一般 GET/HEAD 可以，POST/PATCH/DELETE 默认不要随便重试，因为可能重复创建订单、重复扣款。
status code：哪些状态码触发重试，比如 408/429/500/502/503/504。
Retry-After：服务端返回的 header，告诉客户端“别马上重试，等 N 秒后再来”。
backoff：重试间隔逐渐变长，比如 300ms、600ms、1200ms。
jitter：在 backoff 上加一点随机抖动，避免大量客户端同一时间重试把服务打爆。
shouldRetry：用户自己写函数判断要不要重试。
timeout retry：一次请求超时后，要不要也算作可重试错误。
totalTimeout：整个请求流程的总超时，包括多次 retry 和 retry delay，不只是单次 fetch。

## 考虑采用

原生 fetch 遇到 404/500 不会 throw，只会返回 Response。如果我们做 statusError()，就会在 !res.ok 时抛错。

支持 retry，默认 GET 等安全请求重试，写请求默认不重试。

body 是 plain object 时自动 JSON.stringify，并补 content-type / accept。

支持 timeout，用 AbortSignal.timeout/any。

返回的是被装饰过的 Promise，可以直接 .json() / .text() / .blob()。

非 2xx 默认抛 HTTPError，同时区分 HTTPError、NetworkError、TimeoutError、ForceRetryError。

默认不是 throw，也不是 Response，而是 { data, error }。传 throw: true 才返回数据或抛错。

retry 可以搬一个很小的版本：默认 opt-in、按 method 限制、支持 times/delay/statusCodes/shouldRetry。ky 那套 Retry-After/jitter/totalTimeout/force retry 暂时不用一次搬完。

## 看不懂

HTTPError 会预读错误 body 到 error.data，并做 10 MiB 和 timeout 保护。

retry 很完整：method/status code/Retry-After/backoff/jitter/shouldRetry/timeout retry/totalTimeout。

YakError 应该吸收 ky/ofetch 的经验：HTTP 错误至少带 status/statusText/response/request?，可选带 data，但读取 error body 要用 clone() 或明确由 statusError({ parse }) 控制。

补请求侧能力，但不要塞进 RequestInit：baseURL()、query()、headers()、jsonBody()、timeout() 应该是普通组合函数或独立的请求 middleware。

补 createYak({ fetch }) 或同等 fetch 注入能力，方便测试、SSR、instrumentation。
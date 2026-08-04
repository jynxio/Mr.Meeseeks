# retry 草案

目标：给 yak 增加 opt-in retry，不改变默认 fetch 行为。

## API 形态

先按临时形态设计：

```ts
withRetry(yak, options);
```

> 后期可以考虑做成 Around Hook：`around(fetchArgs, next) => next(fetchArgs)`。

改掉 Yak 的入参：

`yak(input, init)` 改成 `yak(() => [input, init])`

`retry` 每次重试都重新执行 `() => FetchArgs`，让 token、签名、trace id 等动态数据有机会重新生成。

## around hook

around hook 是包住一次完整请求执行的 hook。

它拿到 `fetchArgs` 和 `next`，可以决定：

- 什么时候调用 `next()`。
- 调几次 `next()`。
- 捕获 `next()` 抛出的错误。
- 根据 `Response` 或 error 决定是否重试。

retry 需要 around hook，因为它必须重新执行完整请求，而不是只处理一次 `Response`。

## 默认策略

- 默认 `times: 1`。
- 默认只 retry `GET`、`HEAD`。
- 默认 status codes：`408`、`429`、`500`、`502`、`503`、`504`。
- 默认 delay 使用指数退避。
- 默认 backoffLimit：`30_000` ms。
- 默认支持 `Retry-After`。
- 默认不 retry timeout。
- 默认不 retry abort。
- 默认不 retry `POST`、`PUT`、`PATCH`、`DELETE`。

## delay

默认指数退避：

```ts
delay = 300 * 2 ** (attempt - 1);
```

最终 delay：

```ts
Math.min(delay, backoffLimit);
```

## Retry-After

当 response status 命中 retry status codes，且响应包含 `Retry-After` 时：

- 如果是秒数，转成毫秒。
- 如果是 HTTP date，转成距离当前时间的毫秒数。
- 如果解析失败，回退到默认 delay。
- 最终仍然受 `backoffLimit` 限制。

## jitter

支持 jitter，但不急着开放复杂接口。

第一版可以只支持：

```ts
jitter: boolean;
```

`true` 时在 `0..delay` 之间随机。

## totalTimeout

支持总超时预算，但后续阶段再做。

语义：从第一次请求开始，到所有 retry 结束为止，整体不能超过 `totalTimeout`。

如果剩余时间不足以等待下一次 retry delay，则停止 retry，抛最后一次错误或返回最后一次失败响应。

## 阶段

1. 先实现 `() => FetchArgs`，为动态 token/签名打基础。
2. 再实现最小 retry：`times`、`methods`、`statusCodes`、指数退避、`backoffLimit`。
3. 再补 `Retry-After`。
4. 再补 `jitter`。
5. 最后补 `totalTimeout`。

## 错误处理

- fetch reject 可以参与 retry。
- 用户 abort 不 retry。
- timeout 不 retry。
- 重试耗尽后，保留最后一次错误或最后一次 `Response` 的处理路径。
- 不为了 retry 新增 `network`、`timeout`、`aborted` 对外错误类型。

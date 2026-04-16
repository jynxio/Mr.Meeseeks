/**
 * Minimal Standard Schema v1 interface — compatible with Zod v4, Valibot,
 * ArkType, and any library that implements the spec.
 *
 * @see https://github.com/standard-schema/standard-schema
 */

import { ValidationError } from "./http-error";

export interface StandardSchema<Input = unknown, Output = Input> {
    readonly "~standard": {
        readonly version: 1;
        readonly vendor: string;
        validate(value: unknown): StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
        readonly types?: { readonly input: Input; readonly output: Output };
    };
}

type StandardSchemaResult<T> =
    | { readonly value: T; readonly issues?: undefined }
    | {
          readonly issues: ReadonlyArray<{
              readonly message: string;
              readonly path?: ReadonlyArray<PropertyKey>;
          }>;
      };

/** Extract the output type from a Standard Schema. */
export type InferOutput<S extends StandardSchema> = S["~standard"]["types"] extends {
    output: infer O;
}
    ? O
    : unknown;

/**
 * Validate `data` against a Standard Schema. Throws `ValidationError` on
 * failure; returns the validated (possibly transformed) value on success.
 */
export async function parseSchema<S extends StandardSchema>(
    schema: S,
    data: unknown,
): Promise<InferOutput<S>> {
    const result = await schema["~standard"].validate(data);
    if (result.issues) throw new ValidationError(result.issues);
    return result.value as InferOutput<S>;
}

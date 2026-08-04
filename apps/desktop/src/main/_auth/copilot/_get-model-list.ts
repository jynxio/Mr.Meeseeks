import { z } from "zod";

import { REVERSE_COPILOT_API } from "./_consts";

/**
 * Comprehensive list of all models from all vendors
 */
function getAllModelList() {
    throw new Error("Unimplemented. See https://github.com/anomalyco/models.dev");
}

/**
 * Get the list of GitHub Copilot approved models
 */
async function getAvailableModelList(copilotAccessToken: string) {
    const url = `${REVERSE_COPILOT_API["API_BASE"]}/models`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${copilotAccessToken}`,
            Accept: "application/json",
            ...REVERSE_COPILOT_API.HEADER,
        },
    });

    const raw = await res.json();
    const { data } = availableModelListSchema.parse(raw);

    return data.filter((model) => model.model_picker_enabled && model.policy?.state !== "disabled");
}

/**
 * Reverse-engineered from https://api.githubcopilot.com/models
 * Unused fields are marked as optional to minimize validation failures
 */
const availableModelListSchema = z.looseObject({
    data: z.array(
        z.looseObject({
            id: z.string(),
            name: z.string(),
            model_picker_enabled: z.boolean(),
            policy: z
                .looseObject({
                    state: z.string().optional(),
                    terms: z.string().optional(),
                })
                .optional(),
            capabilities: z
                .looseObject({
                    family: z.string().optional(),
                    limits: z
                        .looseObject({
                            max_context_window_tokens: z.number().optional(),
                            max_non_streaming_output_tokens: z.number().optional(),
                            max_output_tokens: z.number().optional(),
                            max_prompt_tokens: z.number().optional(),
                            max_inputs: z.number().optional(),
                            vision: z
                                .looseObject({
                                    max_prompt_image_size: z.number().optional(),
                                    max_prompt_images: z.number().optional(),
                                    supported_media_types: z.array(z.string()).optional(),
                                })
                                .optional(),
                        })
                        .optional(),
                    object: z.string().optional(),
                    supports: z
                        .looseObject({
                            adaptive_thinking: z.boolean().optional(),
                            max_thinking_budget: z.number().optional(),
                            min_thinking_budget: z.number().optional(),
                            parallel_tool_calls: z.boolean().optional(),
                            reasoning_effort: z.array(z.string()).optional(),
                            streaming: z.boolean().optional(),
                            structured_outputs: z.boolean().optional(),
                            tool_calls: z.boolean().optional(),
                            vision: z.boolean().optional(),
                            dimensions: z.boolean().optional(),
                        })
                        .optional(),
                    tokenizer: z.string().optional(),
                    type: z.string().optional(),
                })
                .optional(),
            model_picker_category: z.string().optional(),
            object: z.string().optional(),
            preview: z.boolean().optional(),
            supported_endpoints: z.array(z.string()).optional(),
            vendor: z.string().optional(),
            version: z.string().optional(),
        }),
    ),
    object: z.string().optional(),
});

export { getAvailableModelList, getAllModelList };

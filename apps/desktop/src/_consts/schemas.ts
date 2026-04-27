import { z } from "zod";

type Word = z.infer<typeof wordSchema>;
const wordSchema = z.object({
    id: z.string(),
    type: z.literal("word"),
    sourceText: z.string(),
    targetText: z.string(),
    pronunciation: z.object({ us: z.string(), uk: z.string() }),
});

type Sentence = z.infer<typeof sentenceSchema>;
const sentenceSchema = z.object({
    id: z.string(),
    type: z.literal("sentence"),
    sourceText: z.string(),
    targetText: z.string(),
});

type Translation = z.infer<typeof translationSchema>;
const translationSchema = z.union([wordSchema, sentenceSchema]);

// @todo
type UserSettings = z.infer<typeof userSettingsSchema>;
const userSettingsSchema = z.object({
    provider: z.enum(["google", "copilot"]).default("google"),
    googleApiKey: z.string().optional(),
    copilotModel: z.string().default("gpt-4o"),
});

export type { Word, Sentence, UserSettings, Translation };
export { wordSchema, sentenceSchema, userSettingsSchema, translationSchema };

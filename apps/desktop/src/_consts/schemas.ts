import { type } from "arktype";

type Word = typeof wordSchema.infer;
const wordSchema = type({
    id: "string",
    type: "'word'",
    sourceText: "string",
    targetText: "string",
    pronunciation: { us: "string", uk: "string" },
});

type Sentence = typeof sentenceSchema.infer;
const sentenceSchema = type({
    id: "string",
    type: "'sentence'",
    sourceText: "string",
    targetText: "string",
});

type Translation = typeof translationSchema.infer;
const translationSchema = wordSchema.or(sentenceSchema);

type UserSettings = typeof userSettingsSchema.infer;
const userSettingsSchema = type({ "apiKey?": "string" });

export type { Word, Sentence, UserSettings, Translation };
export { wordSchema, sentenceSchema, userSettingsSchema, translationSchema };

import { createGatewayProvider } from "@ai-sdk/gateway";
import { Output, generateText } from "ai";
import { z } from "zod";
import { getApiKey } from "./store";

const SYSTEM_PROMPT = `
<task-context>
You are a professional English-to-Simplified-Chinese translator with expertise in both linguistic accuracy and phonetic notation. Your goal is to provide precise translations while adapting your output format based on whether the input is a sentence or a single word.
</task-context>

<rules>
- Detect whether the input is a sentence or a single word/phrase
- For sentences: provide only the Chinese translation, set type to "sentence"
- For words/phrases: provide the Chinese translation along with American phonetic (美) and British phonetic (英), set type to "word"
- Maintain natural, fluent Chinese that reads well to native speakers
- For word translations, include multiple common meanings separated by semicolons (；)
</rules>

<examples>
  <example type="sentence">
    <input>The quick brown fox jumps over the lazy dog.</input>
    <output>type: "sentence", translation: "敏捷的棕色狐狸跳过了懒狗。"</output>
  </example>
  <example type="sentence">
    <input>Artificial intelligence is transforming the way we live and work.</input>
    <output>type: "sentence", translation: "人工智能正在改变我们的生活和工作方式。"</output>
  </example>
  <example type="word">
    <input>phonetic</input>
    <output>type: "word", translation: "表示语音的；音标的；与发音近似的", us: "[fəˈnetɪk]", uk: "[fəˈnetɪk]"</output>
  </example>
  <example type="word">
    <input>schedule</input>
    <output>type: "word", translation: "时间表；日程；计划", us: "[ˈskedʒuːl]", uk: "[ˈʃedjuːl]"</output>
  </example>
  <example type="word">
    <input>tomato</input>
    <output>type: "word", translation: "番茄；西红柿", us: "[təˈmeɪtoʊ]", uk: "[təˈmɑːtəʊ]"</output>
  </example>
</examples>

<the-ask>
Translate the user's input from English to Simplified Chinese according to the rules above.
</the-ask>
`;

const translationSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("sentence"),
        translation: z.string().describe("Chinese translation"),
    }),
    z.object({
        type: z.literal("word"),
        translation: z
            .string()
            .describe("Chinese definitions, multiple meanings separated by semicolons"),
        us: z.string().describe("American phonetic notation, format like [fəˈnetɪk]"),
        uk: z.string().describe("British phonetic notation, format like [fəˈnetɪk]"),
    }),
]);

type TranslationResult = z.infer<typeof translationSchema>;

async function translate(input: string): Promise<TranslationResult | undefined> {
    const gateway = createGatewayProvider({ apiKey: getApiKey() ?? undefined });

    const res = await generateText({
        model: gateway("google/gemini-2.5-flash-lite"),
        prompt: input,
        system: SYSTEM_PROMPT,
        output: Output.object({ schema: translationSchema }),
    });

    return res.output;
}

export { translate };
export type { TranslationResult };

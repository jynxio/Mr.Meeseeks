import { randomUUID } from "node:crypto";
import { Output, generateText } from "ai";
import { z } from "zod";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { Translation, UserSettings } from "@/_consts/schemas";
import { REVERSE_COPILOT_API } from "@/main/_auth/copilot/_consts";
import { llmProvidersStore } from "@/main/_stores/llm-providers";

const COPILOT_MODEL = "gpt-4o";
const SYSTEM_PROMPT = createLLMSystemPrompt();

// LLM 输出的 schema 只保留语义字段，id/sourceText 在落库阶段补齐。
const llmWordSchema = z.object({
    type: z.literal("word"),
    translation: z.string(),
    us: z.string(),
    uk: z.string(),
});
const llmSentenceSchema = z.object({
    type: z.literal("sentence"),
    translation: z.string(),
});
const llmOutputSchema = z.union([llmWordSchema, llmSentenceSchema]);
type LLMOutput = z.infer<typeof llmOutputSchema>;

type TranslateProps = { sourceText: string; settings: UserSettings };

async function translate(props: TranslateProps): Promise<Translation | undefined> {
    return translateViaCopilot(props);
}

async function translateViaCopilot({ sourceText }: TranslateProps): Promise<Translation | undefined> {
    const token = llmProvidersStore.get("copilot")?.copilotToken;
    const copilot = createOpenAICompatible({
        name: "copilot",
        baseURL: REVERSE_COPILOT_API.API_BASE,
        apiKey: token,
        headers: { ...REVERSE_COPILOT_API.HEADER },
    });
    const res = await generateText({
        system: SYSTEM_PROMPT,
        prompt: sourceText,
        model: copilot.chatModel(COPILOT_MODEL),
        output: Output.object({ schema: llmOutputSchema }),
    });

    if (!res.output) return undefined;

    return toTranslation(sourceText, res.output);
}

function toTranslation(sourceText: string, output: LLMOutput): Translation {
    const id = randomUUID();

    if (output.type === "sentence") {
        return {
            id,
            type: "sentence",
            sourceText,
            targetText: output.translation,
        };
    }

    return {
        id,
        type: "word",
        sourceText,
        targetText: output.translation,
        pronunciation: { us: output.us, uk: output.uk },
    };
}

function createLLMSystemPrompt() {
    return `
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
Translate the user's input from English to Simplified Chinese according to the rules above, and respond strictly as a JSON object matching the required schema.
</the-ask>
`;
}

export { translate };

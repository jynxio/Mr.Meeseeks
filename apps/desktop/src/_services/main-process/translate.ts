import { Output, generateText } from "ai";
import { translationSchema } from "@/_consts/schemas";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const SYSTEM_PROMPT = createLLMSystemPrompt();

async function translate(props: Record<"apiKey" | "sourceText", string>) {
    // const gatewayProvider = createGatewayProvider({ apiKey: props.apiKey });
    const googleProvider = createGoogleGenerativeAI({ apiKey: props.apiKey });
    const res = await generateText({
        system: SYSTEM_PROMPT,
        prompt: props.sourceText,
        model: googleProvider("gemini-3-flash-preview"),
        output: Output.object({ schema: translationSchema }),
    });

    return res.output;
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
Translate the user's input from English to Simplified Chinese according to the rules above.
</the-ask>
`;
}

export { translate };

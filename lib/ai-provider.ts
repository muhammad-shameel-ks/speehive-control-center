import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const opencodeGo = createOpenAICompatible({
  name: "opencode-go",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey: process.env.OPENCODE_API_KEY ?? "",
});

export const mimoV25 = opencodeGo("mimo-v2.5");

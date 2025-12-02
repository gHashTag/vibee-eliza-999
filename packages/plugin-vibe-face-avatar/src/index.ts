import {
  type Action,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
  ModelType,
  parseBooleanFromText,
} from "@elizaos/core";
import { GenerateImageInputSchema } from "./types/schemas.js";
import { generateImageWithFallback } from "./actions/generateImage.js";

// Simple OpenAI model handler for TEXT_LARGE
async function textLargeModelHandler(
  runtime: IAgentRuntime,
  params: { prompt: string; [key: string]: any }
): Promise<string> {
  const openaiApiKey = runtime.getSetting("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        {
          role: "user",
          content: params.prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Export plugin with models
export const plugin = {
  name: "vibe-face-avatar",
  description: "Plugin for LoRA training and image generation",
  models: {
    [ModelType.TEXT_LARGE]: textLargeModelHandler,
  },
  actions: [],
  evaluators: [],
  providers: [],
  services: [],
  routes: [],
  events: {},
};

export default plugin;

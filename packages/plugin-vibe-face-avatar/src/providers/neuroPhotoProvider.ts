import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";

export const neuroPhotoProvider: Provider = {
  name: "neuroPhotoProvider",

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<ProviderResult> => {
    const defaultModel =
      runtime.getSetting("DEFAULT_MODEL") || "black-forest-labs/flux-schnell";

    return {
      text: `
# 🎨 NeuroPhoto - AI Image Generation

## Available Commands
- \`/neurophoto <описание>\` - Генерация AI-изображения
- \`нарисуй <описание>\` - Альтернативная команда (русский)
- \`create image <описание>\` - Альтернативная команда (английский)

## Current Configuration
- **Default Model**: ${defaultModel}
- **Generation Time**: 10-30 seconds
- **Image Format**: 9:16 (vertical, для Instagram Stories)
- **Cost**: 7.5⭐ per image

## Examples
✅ **Good prompts**:
- "/neurophoto beautiful sunset over the ocean"
- "нарисуй футуристический город с летающими машинами"
- "create image of a cat in a spacesuit"

❌ **Bad prompts**:
- "/neurophoto cat" (too short, not descriptive)
- "нарисуй" (no description)

## Tips for Better Results
1. Be specific and descriptive
2. Include details about style, colors, mood
3. Mention lighting and composition
4. Use English for best results with most models

## Available Models
- **Flux Schnell**: Fast, high-quality images (default)
- **Flux Pro**: Premium quality, slower
- **SDXL**: General-purpose, reliable
      `.trim(),
      values: {
        defaultModel,
        supportedCommands: [
          "/neurophoto",
          "нарисуй",
          "создай изображение",
          "create image",
        ],
        cost: 7.5,
        currency: "stars",
      },
    };
  },
};

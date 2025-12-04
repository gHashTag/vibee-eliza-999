import { imageProviderRegistry } from "./provider-registry";
import { GenerateImageOptions, ImageGenerationResult } from "../types";
import { TaskEither, left, runTaskEither } from "../utils/functional/result";
import { getUserModelsTask } from "./modelLoader";

/**
 * Hybrid generation function that selects the best provider and generates the image.
 * 
 * PRIORITY LOGIC:
 * 1. User's personal LoRA models (if available) → Fal.ai with LoRA
 * 2. Default Flux Schnell → Best available provider
 */
export async function generateNeuroPhotoHybrid(
  prompt: string,
  modelUrl: string | undefined,
  numImages: number,
  userId: string,
  _context: any,
  botName: string = "neuro_face_bot"
): Promise<ImageGenerationResult> {
  // 1. Try to load user's personal LoRA models from database
  let effectiveModelUrl = modelUrl;
  let effectiveTriggerWord: string | undefined;
  
  if (!modelUrl) {
    // No explicit model specified, try to load user's models
    try {
      // Support both UUID and numeric Telegram IDs
      let userIdentifier: string | number = userId;
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        userIdentifier = parsed;
      }

      const modelsResult = await runTaskEither(getUserModelsTask(userIdentifier, botName));

      if (modelsResult.isRight() && modelsResult.value.length > 0) {
        // User has trained models! Use the first one (most recent)
        const userModel = modelsResult.value[0];
        effectiveModelUrl = userModel.model_url;
        effectiveTriggerWord = userModel.trigger_word;

        console.log(`[NeuroPhoto Hybrid] Using user's personal LoRA: ${userModel.model_name} (trigger: ${effectiveTriggerWord})`);

        // Auto-inject trigger word if not in prompt
        if (effectiveTriggerWord && !prompt.includes(effectiveTriggerWord)) {
          prompt = `${effectiveTriggerWord}, ${prompt}`;
          console.log(`[NeuroPhoto Hybrid] Injected trigger word: "${effectiveTriggerWord}"`);
        }
      } else {
        console.log('[NeuroPhoto Hybrid] No personal LoRA models found, using default Flux');
      }
    } catch (error) {
      console.warn('[NeuroPhoto Hybrid] Failed to load user models (likely no DB connection):', error);
      // Continue with default provider
    }
  }
  
  // 2. Determine provider based on effectiveModelUrl or default
  let provider = await imageProviderRegistry.getBestProvider();
  
  // If modelUrl implies a specific provider (e.g. fal-ai/), try to get that provider
  if (effectiveModelUrl && effectiveModelUrl.includes("fal-ai")) {
    const falProvider = imageProviderRegistry.get("fal");
    if (falProvider) {
      provider = falProvider;
      console.log('[NeuroPhoto Hybrid] Using Fal.ai provider for LoRA model');
    }
  } else if (effectiveModelUrl && !effectiveModelUrl.includes("fal-ai")) {
     // Assume Replicate for others if available
     const replicateProvider = imageProviderRegistry.get("replicate");
     if (replicateProvider) {
       provider = replicateProvider;
       console.log('[NeuroPhoto Hybrid] Using Replicate provider');
     }
  }

  if (!provider) {
    return {
      success: false,
      imageUrls: [],
      metadata: {
        prompt,
        model: effectiveModelUrl || "unknown",
        generationTime: 0,
      },
      error: "No suitable image generation provider found",
    };
  }

  const options: GenerateImageOptions = {
    prompt,
    modelUrl: effectiveModelUrl,
    numImages,
    aspectRatio: "9:16", // Default as per spec
  };

  // Execute generation
  const resultTask: TaskEither<Error, ImageGenerationResult> = provider.generateImage(options);
  const result = await resultTask();

  if (result.isLeft()) {
    return {
      success: false,
      imageUrls: [],
      metadata: {
        prompt,
        model: effectiveModelUrl || "unknown",
        generationTime: 0,
      },
      error: result.value.message,
    };
  }

  return result.value;
}

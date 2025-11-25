import { ModelInfo } from "../types/provider.interface";

// Placeholder configuration for image models based on the spec
// In a real implementation, this might be loaded from a database or a more complex config file
export const IMAGE_MODELS: Record<string, any> = {
  flux_schnell: {
    id: 'flux_schnell',
    name: 'Flux Schnell',
    provider: 'replicate',
    apiModel: 'black-forest-labs/flux-schnell',
    description: 'Fast, high-quality image generation',
    pricing: { fixedPriceStars: 4 },
    apiSettings: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
      maxImages: 4,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      supportsGuidanceScale: true,
    },
    status: 'active',
  },
  fal_flux_lora: {
    id: 'fal_flux_lora',
    name: 'Fal.ai Flux LoRA',
    provider: 'fal',
    apiModel: 'fal-ai/flux-lora',
    description: 'Flux with LoRA support for personalized images',
    pricing: { fixedPriceStars: 4 },
    apiSettings: {
      aspectRatios: ['9:16'],
      maxImages: 4,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      supportsGuidanceScale: true,
      supportsLoRA: true,
    },
    status: 'active',
  },
};

export function getImageModel(id: string) {
  return IMAGE_MODELS[id];
}

export function getImageModelsByProvider(provider: string) {
  return Object.values(IMAGE_MODELS).filter(model => model.provider === provider && model.status === 'active');
}

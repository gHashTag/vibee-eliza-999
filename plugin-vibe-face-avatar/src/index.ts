/**
 * @999-agents/plugin-vibe-avatar-face
 * ElizaOS plugin for AI image generation
 *
 * @author 999-agents
 * @license MIT
 * @version 1.0.0
 */

import { Plugin } from "@elizaos/core";
import { generateImageAction } from "./actions/generateImage";
import { faceTrainAction } from "./actions/faceTrainAction";
import { photoUploadAction } from "./actions/photoUploadAction";
import { listModelsAction } from "./actions/listModelsAction";
import { deleteModelAction } from "./actions/deleteModelAction";
import { setActiveModelAction } from "./actions/setActiveModelAction";
import { neuroPhotoProvider } from "./providers/neuroPhotoProvider";
import { ReplicateService } from "./services/replicateService";
import { FalService } from "./services/falService";
import { initializeProviders } from "./services/providers";

/**
 * NeuroPhoto Plugin for ElizaOS
 *
 * Provides AI image generation capabilities using Replicate/Fal.ai APIs
 */
export const vibeFaceAvatarPlugin: Plugin = {
  name: "neurophoto",
  description: "AI image generation with Replicate/Fal.ai models",

  /**
   * Actions that the agent can perform
   */
  actions: [generateImageAction, faceTrainAction, photoUploadAction, listModelsAction, deleteModelAction, setActiveModelAction],

  /**
   * Services for external APIs
   */
  services: [ReplicateService, FalService],

  /**
   * Providers that give context to the LLM
   */
  providers: [neuroPhotoProvider],

  /**
   * Evaluators (none for MVP)
   */
  evaluators: [],

  /**
   * Инициализация плагина
   */
  init: async (_config, runtime) => {
    console.log("✅ NeuroPhoto plugin initializing...");

    // Services are initialized automatically by ElizaOS via the services array
    // Additional provider initialization
    initializeProviders(runtime);
    console.log("✅ NeuroPhoto plugin initialized");
  },
};

/**
 * Export everything for external use
 */
export * from "./types";
export * from "./actions/generateImage";
export * from "./actions/faceTrainAction";
export * from "./actions/photoUploadAction";
export * from "./actions/listModelsAction";
export * from "./actions/deleteModelAction";
export * from "./actions/setActiveModelAction";
export * from "./providers/neuroPhotoProvider";
export * from "./services/replicateService";
export * from "./services/falService";

/**
 * Default export
 */
export default vibeFaceAvatarPlugin;

import { fal } from "@fal-ai/client";
import { db, userModels } from "../db/client";
import { eq } from "drizzle-orm";

/**
 * Fal.ai LoRA Training Service
 * Handles real training via Fal.ai flux-lora-fast-training
 */

export interface TrainingConfig {
  modelId: string;
  trigger_word: string;
  photo_urls: string[];
  steps?: number;
  lora_rank?: number;
}

/**
 * Start Fal.ai LoRA training (async)
 * Returns immediately, training happens in background
 */
export async function startFalTraining(config: TrainingConfig): Promise<void> {
  const {
    modelId,
    trigger_word,
    photo_urls,
    steps = 500,
    lora_rank = 16,
  } = config;

  console.log(`[FalTraining] Starting training for ${modelId}`);
  console.log(
    `[FalTraining] Photos: ${photo_urls.length}, Steps: ${steps}, Rank: ${lora_rank}`
  );

  try {
    // Configure Fal.ai client
    if (process.env.FAL_KEY) {
      fal.config({
        credentials: process.env.FAL_KEY,
      });
    }

    // Call Fal.ai LoRA fast training
    const result: any = await fal.subscribe("fal-ai/flux-lora-fast-training", {
      input: {
        images_data_url: photo_urls,
        trigger_word,
        steps,
        lora_rank,
      },
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`[FalTraining] Progress update for ${modelId}`);

          // Extract progress from logs
          const progress = extractProgress(update.logs || []);

          // Update database with progress
          (db as any)
            .update(userModels)
            .set({
              metadata: JSON.stringify({
                progress,
                fal_job_id: update.request_id,
                last_log: update.logs?.[update.logs.length - 1]?.message || "",
              }),
            })
            .where(eq(userModels.id, modelId))
            .catch((err: Error) =>
              console.error("[FalTraining] Failed to update progress:", err)
            );
        }
      },
    });

    console.log(`[FalTraining] Training complete for ${modelId}`);
    console.log(`[FalTraining] Result:`, result);

    // Extract model URL from result
    const modelUrl =
      result.diffusers_lora_file?.url || result.config_file?.url || "";

    if (!modelUrl) {
      throw new Error("No model URL returned from Fal.ai");
    }

    // Update database with completed model
    await (db as any)
      .update(userModels)
      .set({
        model_url: modelUrl,
        status: "completed",
        updated_at: new Date().toISOString(),
        metadata: JSON.stringify({
          progress: 100,
          fal_job_id: result.request_id,
          completed_at: new Date().toISOString(),
        }),
      })
      .where(eq(userModels.id, modelId));

    console.log(`[FalTraining] Model saved: ${modelUrl}`);
  } catch (error: any) {
    console.error(`[FalTraining] Training failed for ${modelId}:`, error);

    // Mark as failed in database
    await (db as any)
      .update(userModels)
      .set({
        status: "failed",
        updated_at: new Date().toISOString(),
        metadata: JSON.stringify({
          error: error.message || "Training failed",
          failed_at: new Date().toISOString(),
        }),
      })
      .where(eq(userModels.id, modelId));
  }
}

/**
 * Extract progress percentage from Fal.ai logs
 * Looks for patterns like "Step 250/500" -> 50%
 */
function extractProgress(logs: any[]): number {
  if (!logs || logs.length === 0) return 0;

  const lastLog = logs[logs.length - 1]?.message || "";

  // Try to match "Step X/Y" pattern
  const stepMatch = lastLog.match(/Step (\d+)\/(\d+)/i);
  if (stepMatch) {
    const current = parseInt(stepMatch[1]);
    const total = parseInt(stepMatch[2]);
    return Math.round((current / total) * 100);
  }

  // Try to match "X%" pattern
  const percentMatch = lastLog.match(/(\d+)%/);
  if (percentMatch) {
    return parseInt(percentMatch[1]);
  }

  // Default to 50% if training is in progress
  return 50;
}

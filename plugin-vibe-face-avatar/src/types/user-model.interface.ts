/**
 * Пользовательская модель (обученная через Digital Avatar Body)
 * Это ЕДИНСТВЕННЫЙ тип модели для NeuroPhoto
 */
export interface UserModel {
  id: string; // UUID
  telegram_id: number;
  bot_name: string;
  model_name: string;
  model_url: string; // URL обученной LoRA модели (Replicate или Fal.ai)
  model_key?: string; // Альтернативный ключ
  trigger_word: string; // Например, "NEURO_SAGE" - добавляется в промпт
  gender?: "male" | "female" | "person"; // Из профиля пользователя

  // Обучение
  status: "training" | "completed" | "failed";
  training_steps?: number;
  training_model?: "flux-lora-portrait-trainer" | "flux-lora-fast-training";

  // Команда (общие модели)
  is_team_model?: boolean;
  team_id?: string;

  // Метаданные
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// Re-export from modelLoader for backward compatibility
// This ensures all imports from this file work correctly
export {
  getUserModelsTask,
  UserModelDB,
} from "../services/modelLoader";

// For cases where UserModel type is needed but UserModelDB is from modelLoader
// We maintain both interfaces for compatibility
export type { UserModelDB as UserModelDatabase };

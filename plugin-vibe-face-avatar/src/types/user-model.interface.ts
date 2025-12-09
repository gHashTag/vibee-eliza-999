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

/**
 * User Model from Database (compatible with DB schema)
 */
export interface UserModelDB {
  id: string;
  telegram_id: number | null;
  entity_id: string | null;
  bot_name: string;
  model_name: string;
  model_url: string;
  trigger_word: string;
  gender?: string | null;
  training_model?: string | null;
  status: string;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// Re-export getUserModelsTask from modelLoader for backward compatibility
export { getUserModelsTask } from "../services/modelLoader";

// Alias for backward compatibility
export type UserModelDatabase = UserModelDB;

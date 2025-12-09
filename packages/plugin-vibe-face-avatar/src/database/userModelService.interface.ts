/**
 * @fileoverview Avatar Face Plugin - Database Service Interface
 *
 * This module defines the database service interface for managing
 * user-trained LoRA models used in the Avatar Face plugin.
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import { UserModel } from '../types/index.js'

/**
 * Database service interface for user model management
 */
export interface IUserModelDatabaseService {
  /**
   * Configuration object
   */
  readonly config: UserModelDatabaseConfig

  /**
   * Получение активных моделей пользователя
   */
  getActiveUserModels(
    telegramId: number,
    botName: string
  ): Promise<UserModel[]>

  /**
   * Получение модели по ID
   */
  getUserModelById(modelId: string): Promise<UserModel | null>

  /**
   * Создание новой записи о модели
   */
  createUserModel(
    model: Omit<UserModel, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserModel>

  /**
   * Обновление статуса модели
   */
  updateModelStatus(
    modelId: string,
    status: 'training' | 'completed' | 'failed',
    metadata?: Partial<UserModel>
  ): Promise<void>

  /**
   * Активация/деактивация модели
   */
  setModelActive(modelId: string, isActive: boolean): Promise<void>

  /**
   * Получение всех моделей пользователя
   */
  getAllUserModels(
    telegramId: number,
    botName: string
  ): Promise<UserModel[]>

  /**
   * Удаление модели
   */
  deleteUserModel(modelId: string): Promise<void>
}

/**
 * Configuration for database service
 */
export interface UserModelDatabaseConfig {
  supabaseUrl: string
  supabaseKey: string
}

import { z } from "zod";

/**
 * Типы для работы с Instagram плагином
 */

// Схема для вложения (attachment)
export const AttachmentSchema = z.object({
  id: z.string().optional(),
  type: z.string(), // 'image', 'video', 'file', etc.
  url: z.string().url().optional(),
  contentType: z.string().optional(), // MIME type
  name: z.string().optional(),
  size: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Схема для поста Instagram
export const InstagramPostSchema = z.object({
  caption: z.string().min(1, "Подпись обязательна"),
  imageUrl: z.string().url("Некорректный URL изображения"),
  mediaType: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]).default("IMAGE"),
  hashtags: z.array(z.string()).default([]),
  location: z.string().optional(),
});

// Схема для результата загрузки файла
export const UploadResultSchema = z.object({
  url: z.string().url(),
  path: z.string(),
  size: z.number(),
  contentType: z.string(),
});

// Схема для ответа Instagram API
export const InstagramApiResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  error: z
    .object({
      code: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});

// Экспортируем типы
export type Attachment = z.infer<typeof AttachmentSchema>;
export type UploadResult = z.infer<typeof UploadResultSchema>;
export type InstagramApiResponse = z.infer<typeof InstagramApiResponseSchema>;

/**
 * Типы для работы с файлами и вложениями
 */

// Типы сообщений из Telegram
export interface TelegramMessageContent {
  text?: string;
  attachments?: Attachment[];
  source?: string;
}

// Информация о загруженном файле
export interface UploadedFileInfo {
  originalUrl: string;
  uploadedUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  timestamp: number;
}

// Результат парсинга сообщения
export interface ParsedMessageResult {
  caption: string;
  imageUrl: string;
  hashtags: string[];
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  attachments: Attachment[];
  filesUploaded?: UploadedFileInfo[];
}

/**
 * Типы для Instagram сервиса
 */

// Типы для постов и сторис
export interface InstagramPost {
  caption: string;
  imageUrl: string;
  mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  hashtags?: string[];
  location?: string;
}

export interface InstagramStory {
  mediaUrl: string;
  caption?: string;
}

export interface InstagramMetrics {
  postId: string;
  metrics: string[];
}

// Интерфейс сервиса
export interface InstagramService {
  publishPost(post: InstagramPost): Promise<any>;
  publishStory(story: InstagramStory): Promise<any>;
  getMetrics(metrics: InstagramMetrics): Promise<any>;
  getAccountInfo(): Promise<any>;
  getMediaLibrary(limit?: number): Promise<any>;
  checkConnection(): Promise<boolean>;
  validateToken(): Promise<{
    valid: boolean;
    error?: string;
    expiresAt?: string;
    refreshed?: boolean;
  }>;
  refreshToken(): Promise<{
    success: boolean;
    newToken?: string;
    error?: string;
  }>;
}

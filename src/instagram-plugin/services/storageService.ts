import { Service } from '@elizaos/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { IAgentRuntime } from '@elizaos/core';

/**
 * Сервис для работы с облачным хранилищем файлов (Supabase Storage)
 */
export class StorageService extends Service {
  static serviceType = 'storage';

  capabilityDescription = 'Supabase Storage Service - для загрузки файлов в облако';

  private supabase: SupabaseClient;
  private bucketName = 'instagram-uploads';

  async stop(): Promise<void> {
    console.log('💾 [StorageService] Сервис остановлен');
  }

  constructor() {
    super();
    try {
      this.supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );
    } catch (error) {
      console.warn(`⚠️ [StorageService] Ошибка создания Supabase клиента: ${error instanceof Error ? error.message : String(error)}`);
      // Создаем "пустого" клиента, чтобы избежать null reference ошибок
      this.supabase = createClient('', '');
    }
  }

  static async start(runtime: IAgentRuntime): Promise<StorageService> {
    console.log('💾 [StorageService] Инициализация Supabase Storage...');

    const service = new StorageService();

    // Проверяем наличие переменных окружения
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('ℹ️ [StorageService] SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не установлены');
      console.log('ℹ️ [StorageService] Сервис будет работать в fallback режиме (файлы не будут загружаться в облако)');
      return service;
    }

    try {
      // Проверяем подключение к Supabase
      const { data, error } = await service.supabase.storage.listBuckets();

      if (error) {
        // Если URL пустой или неверный, просто работаем в fallback режиме
        console.log('ℹ️ [StorageService] Подключение к Supabase недоступно');
        console.log('ℹ️ [StorageService] Сервис будет работать в fallback режиме (файлы не будут загружаться в облако)');
        return service;
      }

      console.log(`✅ [StorageService] Подключение к Supabase установлено`);
      console.log(`✅ [StorageService] Найдено bucket'ов: ${data?.length || 0}`);

      // Создаем bucket если не существует
      const bucketExists = data?.find(bucket => bucket.name === service.bucketName);

      if (!bucketExists) {
        console.log(`🔄 [StorageService] Создание bucket '${service.bucketName}'...`);
        const { error: createError } = await service.supabase.storage.createBucket(
          service.bucketName,
          {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: [
              'image/jpeg',
              'image/png',
              'image/webp',
              'image/gif',
              'video/mp4',
              'video/quicktime'
            ]
          }
        );

        if (createError) {
          console.warn(`⚠️ [StorageService] Bucket не создан: ${createError.message}`);
          console.log('⚠️ [StorageService] Сервис будет работать в fallback режиме (без загрузки в облако)');
        } else {
          console.log(`✅ [StorageService] Bucket '${service.bucketName}' создан`);
        }
      } else {
        console.log(`✅ [StorageService] Bucket '${service.bucketName}' уже существует`);
      }

      // Запускаем автоочистку старых файлов
      service.scheduleCleanup();
    } catch (error) {
      console.warn(`⚠️ [StorageService] Ошибка инициализации: ${error}`);
      console.log('⚠️ [StorageService] Сервис будет работать в fallback режиме (без загрузки в облако)');
    }

    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('💾 [StorageService] Остановка сервиса...');
  }

  /**
   * Загружает файл в Supabase Storage
   */
  async uploadFile(fileUrl: string, fileName?: string): Promise<{ url: string; path: string }> {
    try {
      console.log(`📤 [StorageService] Загрузка файла: ${fileUrl}`);

      // Проверяем, что Supabase доступен
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('ℹ️ [StorageService] Supabase недоступен, работаем в fallback режиме');
        throw new Error('Supabase не настроен. Пожалуйста, установите SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
      }

      // Генерируем уникальное имя файла
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = fileName?.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}-${random}.${extension}`;

      // Скачиваем файл по URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Не удалось скачать файл: ${response.statusText}`);
      }

      const fileBuffer = await response.arrayBuffer();
      const fileUint8Array = new Uint8Array(fileBuffer);

      // Определяем MIME тип
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Загружаем в Supabase
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(uniqueFileName, fileUint8Array, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Ошибка загрузки в Supabase: ${error.message}`);
      }

      // Получаем публичный URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uniqueFileName);

      console.log(`✅ [StorageService] Файл загружен: ${urlData.publicUrl}`);

      return {
        url: urlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error(`❌ [StorageService] Ошибка загрузки:`, error);
      throw error;
    }
  }

  /**
   * Скачивает файл из Supabase Storage как Buffer
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    try {
      console.log(`📥 [StorageService] Скачивание файла: ${filePath}`);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        throw new Error(`Ошибка скачивания: ${error.message}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`❌ [StorageService] Ошибка скачивания:`, error);
      throw error;
    }
  }

  /**
   * Удаляет файл из Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      console.log(`🗑️ [StorageService] Удаление файла: ${filePath}`);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Ошибка удаления: ${error.message}`);
      }

      console.log(`✅ [StorageService] Файл удален: ${filePath}`);
    } catch (error) {
      console.error(`❌ [StorageService] Ошибка удаления:`, error);
      throw error;
    }
  }

  /**
   * Автоочистка старых файлов (старше 24 часов)
   */
  private scheduleCleanup(): void {
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 час
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 часа

    console.log(`⏰ [StorageService] Запуск автоочистки каждые ${CLEANUP_INTERVAL / 1000 / 60} минут`);

    setInterval(async () => {
      try {
        console.log('🧹 [StorageService] Проверка старых файлов...');

        const { data: files, error } = await this.supabase.storage
          .from(this.bucketName)
          .list();

        if (error) {
          console.error(`❌ [StorageService] Ошибка получения списка файлов:`, error);
          return;
        }

        if (!files || files.length === 0) {
          console.log('ℹ️ [StorageService] Файлов для очистки не найдено');
          return;
        }

        const now = Date.now();
        const oldFiles = files.filter(file => {
          const fileAge = now - (file.updated_at ? new Date(file.updated_at).getTime() : 0);
          return fileAge > MAX_AGE;
        });

        if (oldFiles.length > 0) {
          const pathsToDelete = oldFiles.map(file => file.name);
          await this.supabase.storage
            .from(this.bucketName)
            .remove(pathsToDelete);

          console.log(`✅ [StorageService] Удалено ${oldFiles.length} старых файлов`);
        } else {
          console.log('ℹ️ [StorageService] Старых файлов не найдено');
        }
      } catch (error) {
        console.error(`❌ [StorageService] Ошибка автоочистки:`, error);
      }
    }, CLEANUP_INTERVAL);
  }

  /**
   * Получает информацию о файле
   */
  async getFileInfo(filePath: string): Promise<{ size: number; created: string; publicUrl: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          search: filePath
        });

      if (error) {
        throw new Error(`Ошибка получения информации о файле: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(`Файл не найден: ${filePath}`);
      }

      const file = data[0];
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        size: file.metadata?.size || 0,
        created: file.created_at || '',
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error(`❌ [StorageService] Ошибка получения информации:`, error);
      throw error;
    }
  }
}

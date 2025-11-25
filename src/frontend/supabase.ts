import { createClient } from '@supabase/supabase-js';

/**
 * Конфигурация Supabase для фронтенда
 * Использует анонимный ключ для доступа к Storage
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * Создаем Supabase клиент для фронтенда
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Типы для Storage
 */
export interface UploadResult {
  path: string;
  url: string;
  fullPath: string;
}

/**
 * Загрузка файла в Supabase Storage
 */
export const uploadFileToStorage = async (
  file: File,
  bucket: string = 'instagram-uploads'
): Promise<UploadResult | null> => {
  try {
    // Создаем уникальное имя файла
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomSuffix}.${fileExtension}`;

    // Загружаем файл
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ [Supabase] Ошибка загрузки:', error);
      return null;
    }

    if (!data) {
      console.error('❌ [Supabase] Нет данных от сервера');
      return null;
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('✅ [Supabase] Файл загружен:', urlData.publicUrl);

    return {
      path: data.path,
      url: urlData.publicUrl,
      fullPath: data.fullPath,
    };
  } catch (error) {
    console.error('❌ [Supabase] Исключение при загрузке:', error);
    return null;
  }
};

/**
 * Удаление файла из Storage
 */
export const deleteFileFromStorage = async (
  path: string,
  bucket: string = 'instagram-uploads'
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('❌ [Supabase] Ошибка удаления:', error);
      return false;
    }

    console.log('✅ [Supabase] Файл удален:', path);
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Исключение при удалении:', error);
    return false;
  }
};

/**
 * Проверка доступности Storage
 */
export const checkStorageAvailability = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket('instagram-uploads');
    return !error;
  } catch {
    return false;
  }
};

export default supabase;

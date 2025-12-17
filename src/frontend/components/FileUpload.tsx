import React, { useState, useCallback } from "react";
import type { UUID } from "@elizaos/core";
import { uploadFileToStorage, deleteFileFromStorage } from "../supabase";

interface FileUploadProps {
  agentId: UUID;
  onUploadComplete?: (fileUrl: string) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
  url?: string;
}

/**
 * Компонент для загрузки файлов с drag & drop
 */
const FileUpload: React.FC<FileUploadProps> = ({
  agentId,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Обработка drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  // Обработка выбора файлов
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
      }
    },
    [],
  );

  // Обработка файлов
  const handleFiles = useCallback(
    (fileList: File[]) => {
      const newFiles: UploadedFile[] = fileList.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        uploading: false,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Автоматическая загрузка
      newFiles.forEach((uploadFile, index) => {
        uploadFileToSupabase(uploadFile, files.length + index);
      });
    },
    [files.length],
  );

  // Загрузка файла в Supabase Storage
  const uploadFileToSupabase = useCallback(
    async (uploadFile: UploadedFile, index: number) => {
      try {
        // Обновляем статус на загрузку
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, uploading: true, error: undefined } : f,
          ),
        );

        // Загружаем в Supabase Storage
        const result = await uploadFileToStorage(uploadFile.file);

        if (!result) {
          throw new Error("Не удалось загрузить файл в Supabase");
        }

        // Обновляем статус на успех
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  uploading: false,
                  uploaded: true,
                  url: result.url,
                }
              : f,
          ),
        );

        // Уведомляем родительский компонент
        if (onUploadComplete && result.url) {
          onUploadComplete(result.url);
        }

        console.log("✅ [FileUpload] Файл загружен:", result.url);
      } catch (error) {
        console.error("❌ [FileUpload] Ошибка загрузки:", error);
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  uploading: false,
                  error:
                    error instanceof Error ? error.message : "Ошибка загрузки",
                }
              : f,
          ),
        );
      }
    },
    [onUploadComplete],
  );

  // Удаление файла
  const removeFile = useCallback(async (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }

      // Удаляем из Supabase если файл был загружен
      if (file.url) {
        // Извлекаем путь из URL
        const urlParts = file.url.split("/");
        const path = urlParts.slice(-2).join("/"); // last two parts: bucket/path
        deleteFileFromStorage(path).catch((err) => {
          console.error("❌ [FileUpload] Ошибка удаления из Storage:", err);
        });
      }

      return prev.filter((_, i) => i !== index);
    });
  }, []);

  return (
    <div className="file-upload-container">
      {/* Зона drag & drop */}
      <div
        className={`drag-drop-zone ${isDragging ? "dragging" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="drag-drop-content">
          <svg
            className="upload-icon"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h3>Перетащите файлы сюда</h3>
          <p>или</p>
          <label className="file-input-label">
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <span className="upload-button">Выберите файлы</span>
          </label>
        </div>
      </div>

      {/* Список файлов */}
      {files.length > 0 && (
        <div className="uploaded-files">
          <h4>Загруженные файлы:</h4>
          <div className="files-grid">
            {files.map((uploadFile, index) => (
              <div key={index} className="file-item">
                {/* Превью изображения */}
                {uploadFile.preview && (
                  <div className="file-preview">
                    <img src={uploadFile.preview} alt="Preview" />
                  </div>
                )}

                {/* Информация о файле */}
                <div className="file-info">
                  <div className="file-name">{uploadFile.file.name}</div>
                  <div className="file-size">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>

                  {/* Статус */}
                  <div className="file-status">
                    {uploadFile.uploading && (
                      <div className="status uploading">
                        <div className="spinner"></div>
                        Загрузка...
                      </div>
                    )}
                    {uploadFile.uploaded && (
                      <div className="status uploaded">✅ Загружено</div>
                    )}
                    {uploadFile.error && (
                      <div className="status error">❌ {uploadFile.error}</div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="file-actions">
                    {!uploadFile.uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="remove-button"
                      >
                        🗑️ Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

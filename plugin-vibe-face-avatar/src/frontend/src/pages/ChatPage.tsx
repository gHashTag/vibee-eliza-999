"use client";

import { useState, useEffect } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageResponse,
  MessageAttachments,
  MessageAttachment,
  PromptInput,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/chat";
import type { FileUIPart } from "@/components/chat/prompt-input";

type ChatMessage = {
  id: string;
  from: "user" | "assistant";
  text: string;
  attachments?: Array<{
    id: string;
    url: string;
    filename?: string;
    mediaType?: string;
  }>;
};

type UserModel = {
  id: string;
  name: string;
  trigger_word: string;
  status: "training" | "completed" | "failed";
  created_at: string;
};

const API_BASE = "http://localhost:3001";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileUIPart[]>([]);
  const [userModels, setUserModels] = useState<UserModel[]>([]);
  const [awaitingModelName, setAwaitingModelName] = useState(false);
  const [selectedModel, setSelectedModel] = useState<UserModel | null>(null);

  // Загрузка моделей при старте
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/models?telegram_id=123456`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.models) {
            const models = data.models.map((m: any) => ({
              id: m.id,
              name: m.name,
              trigger_word: m.trigger_word,
              status: 'completed' as const,
              created_at: m.created_at,
            }));
            setUserModels(models);
            if (models.length > 0) {
              setSelectedModel(models[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };
    loadModels();
  }, []);

  // Быстрая генерация с выбранной моделью
  const handleQuickGenerate = async (model: UserModel, prompt: string) => {
    setSelectedModel(model);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_id: "123456",
          prompt: `${model.trigger_word} ${prompt}`,
          model_id: model.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          from: "user",
          text: `/neurophoto ${prompt}`,
        },
        {
          id: (Date.now() + 1).toString(),
          from: "assistant",
          text: `Generated with model "${model.name}"`,
          attachments: [{
            id: "result",
            url: data.image_url || "https://picsum.photos/512/512",
            filename: "generated.png",
            mediaType: "image/png",
          }],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          from: "assistant",
          text: error instanceof Error ? error.message : "Generation failed",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (message: { text: string; files: any[] }) => {
    // Если есть вложения, сохраняем их как pending файлы для обучения
    if (message.files.length > 0) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        from: "user",
        text: message.text || "Прикрепил фото",
        attachments: message.files.map((f) => ({
          id: f.id,
          url: f.url,
          filename: f.filename,
          mediaType: f.mediaType,
        })),
      };

      setPendingFiles((prev) => [...prev, ...message.files]);
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: (Date.now() + 1).toString(),
          from: "assistant",
          text: `Фото загружено! Прикреплено ${message.files.length} файлов.\n\nДля обучения модели введите: /face train [название]` +
                (!userModels.length ? "\n\nУ вас пока нет обученных моделей." : ""),
        },
      ]);
      return;
    }

    // Обработка команды обучения
    if (message.text.startsWith("/face train")) {
      setIsLoading(true);

      try {
        if (pendingFiles.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              from: "user",
              text: message.text,
            },
            {
              id: (Date.now() + 1).toString(),
              from: "assistant",
              text: "Сначала загрузите 10-25 фотографий себя (без очков, в хорошем качестве), а затем снова введите /face train",
            },
          ]);
          return;
        }

        const modelName = message.text.replace("/face train", "").trim();
        if (!modelName) {
          setAwaitingModelName(true);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              from: "user",
              text: message.text,
            },
            {
              id: (Date.now() + 1).toString(),
              from: "assistant",
              text: "Введите название для вашей модели (например: \"Мой цифровой двойник\"):",
            },
          ]);
          return;
        }

        // Симуляция загрузки фото
        const photoUrls = pendingFiles.map(f => f.url);

        // Запуск обучения
        const response = await fetch(`${API_BASE}/api/train`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telegram_id: "123456",
            model_name: modelName,
            trigger_word: `${modelName.toUpperCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`,
            gender: "person",
            photo_urls: photoUrls,
          }),
        });

        if (!response.ok) {
          throw new Error("Ошибка обучения модели");
        }

        const trainData = await response.json();

        // Добавляем модель в список (симуляция)
        const newModel: UserModel = {
          id: trainData.model_id || `model_${Date.now()}`,
          name: modelName,
          trigger_word: `${modelName.toUpperCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`,
          status: "training",
          created_at: new Date().toISOString(),
        };

        setUserModels((prev) => [...prev, newModel]);
        setPendingFiles([]);
        setAwaitingModelName(false);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            from: "user",
            text: message.text,
          },
          {
            id: (Date.now() + 1).toString(),
            from: "assistant",
            text: `✅ Модель "${modelName}" создана и отправлена на обучение!\n\nОбычно это занимает 10-15 минут. После завершения вы сможете использовать её для генерации изображений командой /neurophoto`,
          },
        ]);

      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            from: "user",
            text: message.text,
          },
          {
            id: (Date.now() + 1).toString(),
            from: "assistant",
            text: error instanceof Error ? error.message : "Ошибка при обучении модели",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Если ожидаем название модели
    if (awaitingModelName) {
      setIsLoading(true);

      try {
        const modelName = message.text.trim();
        if (!modelName) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              from: "user",
              text: message.text,
            },
            {
              id: (Date.now() + 1).toString(),
              from: "assistant",
              text: "Название не может быть пустым. Введите название модели:",
            },
          ]);
          return;
        }

        const photoUrls = pendingFiles.map(f => f.url);

        const response = await fetch(`${API_BASE}/api/train`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telegram_id: "123456",
            model_name: modelName,
            trigger_word: `${modelName.toUpperCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`,
            gender: "person",
            photo_urls: photoUrls,
          }),
        });

        const trainData = await response.json();

        const newModel: UserModel = {
          id: trainData.model_id || `model_${Date.now()}`,
          name: modelName,
          trigger_word: `${modelName.toUpperCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`,
          status: "training",
          created_at: new Date().toISOString(),
        };

        setUserModels((prev) => [...prev, newModel]);
        setPendingFiles([]);
        setAwaitingModelName(false);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            from: "user",
            text: message.text,
          },
          {
            id: (Date.now() + 1).toString(),
            from: "assistant",
            text: `✅ Модель "${modelName}" создана и отправлена на обучение!\n\nОбычно это занимает 10-15 минут. После завершения вы сможете использовать её для генерации изображений.`,
          },
        ]);

      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            from: "user",
            text: message.text,
          },
          {
            id: (Date.now() + 1).toString(),
            from: "assistant",
            text: error instanceof Error ? error.message : "Ошибка при обучении модели",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Обработка генерации изображения
    if (message.text.startsWith("/neurophoto")) {
      setIsLoading(true);

      try {
        const prompt = message.text.replace("/neurophoto", "").trim();
        if (!prompt) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              from: "user",
              text: message.text,
            },
            {
              id: (Date.now() + 1).toString(),
              from: "assistant",
              text: "Укажите описание для генерации:\n/neurophoto красивый закат над океаном",
            },
          ]);
          return;
        }

        const response = await fetch(`${API_BASE}/api/neurophoto`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telegram_id: "123456",
            prompt: prompt,
          }),
        });

        if (!response.ok) {
          throw new Error("Ошибка генерации изображения");
        }

        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            from: "user",
            text: message.text,
          },
          {
            id: (Date.now() + 1).toString(),
            from: "assistant",
            text: `✅ Изображение сгенерировано!\n\nПромпт: ${prompt}` +
                  (userModels.length ? `\n\nИспользована модель: ${userModels[0]?.name || "базовая"}` : ""),
            attachments: [{
              id: "result",
              url: data.image_url || "https://picsum.photos/512/512",
              filename: "generated.png",
              mediaType: "image/png",
            }],
          },
        ]);

      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            from: "user",
            text: message.text,
          },
          {
            id: (Date.now() + 1).toString(),
            from: "assistant",
            text: error instanceof Error ? error.message : "Ошибка при генерации изображения",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Обычный ответ
    const responseText =
      "Доступные команды:\n\n" +
      "• Загрузите фото → /face train [название] - обучить модель\n" +
      "• /neurophoto [промпт] - сгенерировать изображение\n\n" +
      (userModels.length
        ? `Ваши модели (${userModels.length}):\n${userModels.map(m => `• ${m.name} (${m.status})`).join('\n')}`
        : "У вас пока нет обученных моделей");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        from: "user",
        text: message.text,
      },
      {
        id: (Date.now() + 1).toString(),
        from: "assistant",
        text: responseText,
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-200px)] flex bg-quantum-black text-quantum-white">
      {/* Боковая панель с моделями */}
      <div className="w-64 border-r border-quantum-gray bg-quantum-dark p-4 overflow-y-auto">
        <h3 className="text-quantum-yellow font-bold mb-3 text-sm">
          Ваши модели ({userModels.length})
        </h3>

        {userModels.length === 0 ? (
          <div className="text-xs text-gray-400 space-y-2">
            <p>Нет обученных моделей</p>
            <p className="text-quantum-accent">
              1. Загрузите 10-25 фото
            </p>
            <p className="text-quantum-accent">
              2. Введите /face train
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userModels.map((model) => (
              <div
                key={model.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedModel?.id === model.id
                    ? 'border-quantum-yellow bg-quantum-yellow/10'
                    : 'border-quantum-gray hover:border-quantum-accent'
                }`}
                onClick={() => setSelectedModel(model)}
              >
                <div className="text-sm font-medium text-white truncate">
                  {model.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {model.trigger_word}
                </div>
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickGenerate(model, 'portrait photo');
                    }}
                    className="text-[10px] px-2 py-1 bg-quantum-accent/20 text-quantum-accent rounded hover:bg-quantum-accent/40"
                  >
                    Portrait
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickGenerate(model, 'cyberpunk style');
                    }}
                    className="text-[10px] px-2 py-1 bg-quantum-yellow/20 text-quantum-yellow rounded hover:bg-quantum-yellow/40"
                  >
                    Cyber
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Быстрые действия */}
        <div className="mt-4 pt-4 border-t border-quantum-gray">
          <p className="text-xs text-gray-400 mb-2">Быстрые действия:</p>
          <div className="space-y-2">
            {selectedModel && (
              <>
                <button
                  onClick={() => handleQuickGenerate(selectedModel, 'professional headshot')}
                  className="w-full text-xs px-3 py-2 bg-quantum-accent text-black rounded font-medium hover:bg-quantum-accent/80"
                >
                  Professional Shot
                </button>
                <button
                  onClick={() => handleQuickGenerate(selectedModel, 'anime style portrait')}
                  className="w-full text-xs px-3 py-2 bg-quantum-yellow text-black rounded font-medium hover:bg-quantum-yellow/80"
                >
                  Anime Style
                </button>
                <button
                  onClick={() => handleQuickGenerate(selectedModel, 'sunset beach vacation')}
                  className="w-full text-xs px-3 py-2 bg-orange-500 text-white rounded font-medium hover:bg-orange-600"
                >
                  Beach Photo
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Основная область чата */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <Conversation className="flex-1">
            <ConversationContent className="flex-1">
              {messages.length === 0 ? (
                <ConversationEmptyState>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-quantum-yellow">
                      Добро пожаловать в VIBEE!
                    </h2>
                    <p className="text-white">
                      Создавайте цифровые копии и генерируйте изображения
                    </p>
                    {userModels.length > 0 && (
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm font-medium">
                          У вас {userModels.length} обученных моделей
                        </p>
                        <p className="text-white text-xs mt-1">
                          Выберите модель слева и нажмите кнопку для генерации
                        </p>
                      </div>
                    )}
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="text-white">
                        <span className="text-quantum-yellow">1.</span> Загрузите 10-25 фото себя
                      </p>
                      <p className="text-white">
                        <span className="text-quantum-yellow">2.</span> Введите: <span className="text-quantum-accent">/face train название</span>
                      </p>
                      <p className="text-white">
                        <span className="text-quantum-yellow">3.</span> Генерируйте: <span className="text-quantum-accent">/neurophoto промпт</span>
                      </p>
                    </div>
                    {pendingFiles.length > 0 && (
                      <div className="mt-4 p-3 bg-quantum-yellow/10 border border-quantum-yellow/30 rounded-lg">
                        <p className="text-quantum-yellow text-sm font-medium">
                          Загружено фото: {pendingFiles.length}
                        </p>
                        <p className="text-white text-xs mt-1">
                          Теперь введите: /face train [название]
                        </p>
                      </div>
                    )}
                  </div>
                </ConversationEmptyState>
              ) : (
              messages.map((msg) => (
                <Message key={msg.id} from={msg.from}>
                  <MessageContent>
                    <MessageResponse>{msg.text}</MessageResponse>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <MessageAttachments>
                        {msg.attachments.map((att) => (
                          <MessageAttachment
                            key={att.id}
                            data={{
                              type: "file",
                              url: att.url,
                              filename: att.filename,
                              mediaType: att.mediaType,
                            }}
                          />
                        ))}
                      </MessageAttachments>
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
            {isLoading && (
              <Message from="assistant">
                <MessageContent>
                  <div className="flex items-center gap-2 text-white">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-quantum-yellow border-t-transparent"></div>
                    Обрабатываю запрос...
                  </div>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="h-[200px] border-t border-quantum-gray bg-quantum-dark">
        <PromptInput onSubmit={handleSubmit}>
          <div className="space-y-3 p-4 h-full">
            <PromptInputAttachments>
              {(attachment) => (
                <PromptInputAttachment data={attachment} />
              )}
            </PromptInputAttachments>

            <div className="flex items-end gap-2 h-full">
              <div className="flex-1">
                <PromptInputTextarea
                  placeholder={pendingFiles.length > 0 ? "Теперь введите: /face train [название]" : "Загрузите фото или введите команду..."}
                  rows={1}
                />
              </div>
              <PromptInputSubmit status={isLoading ? "submitted" : "idle"} />
            </div>
          </div>
        </PromptInput>
      </div>
    </div>
  );
}

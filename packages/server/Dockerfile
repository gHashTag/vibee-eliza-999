FROM node:20-alpine

WORKDIR /app

# Устанавливаем bun глобально
RUN npm install -g bun

# Копируем файлы
COPY . .

# Устанавливаем все зависимости
RUN bun install

# Удаляем все существующие dist директории для чистой сборки
RUN find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Очищаем кэш bun
RUN bun run --cwd /app store prune

# Собираем ВСЕ пакеты в правильном порядке (core → plugin-sql → server)
# turbo автоматически определит правильный порядок зависимостей
RUN bun run build

# Запускаем сервер
EXPOSE 3000
CMD ["node", "packages/server/dist/entrypoint.js"]

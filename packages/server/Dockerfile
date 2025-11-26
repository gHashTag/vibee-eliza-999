FROM node:20-alpine

WORKDIR /app

# Устанавливаем bash, git и bun
RUN apk add --no-cache bash git && npm install -g bun

# Сначала копируем только конфигурационные файлы для workspace
COPY package.json bunfig.toml ./

# Копируем ВСЕ packages (включая server)
COPY packages ./packages
COPY scripts ./scripts
COPY tsconfig.json ./

# Устанавливаем зависимости (теперь увидит workspace packages)
RUN bun install

# Удаляем все существующие dist директории для чистой сборки
RUN find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Собираем ВСЕ пакеты в правильном порядке (core → plugin-sql → server)
RUN bun run build

# Запускаем сервер
EXPOSE 3000
CMD ["node", "packages/server/dist/entrypoint.js"]

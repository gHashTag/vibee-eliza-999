FROM node:20-alpine

WORKDIR /app

# Устанавливаем bash, git и bun
RUN apk add --no-cache bash git && npm install -g bun

# Копируем конфигурационные файлы
COPY package.json bunfig.toml ./

# Копируем исходный код
COPY packages ./packages
COPY scripts ./scripts
COPY tsconfig.json ./
COPY turbo.json ./
COPY build-utils.ts ./

# Устанавливаем зависимости
ENV SKIP_POSTINSTALL=1
RUN bun install

# Собираем packages/core отдельно
RUN cd packages/core && rm -rf node_modules && cp -r /app/node_modules . && bun run build

# Удаляем все dist директории для чистой сборки
RUN find packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Собираем ТОЛЬКО server вручную (сначала устанавливаем зависимости)
RUN cd packages/server && rm -rf node_modules && cp -r /app/node_modules . && bun install --no-frozen-lockfile && bun run build

# Запускаем сервер
EXPOSE 3000
CMD ["node", "packages/server/dist/entrypoint.js"]

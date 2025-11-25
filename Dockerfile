FROM node:20-alpine

WORKDIR /app

# Устанавливаем bash, git и bun
RUN apk add --no-cache bash git && npm install -g bun

# Копируем основные файлы конфигурации
COPY package.json bunfig.toml ./

# Копируем все файлы из git
COPY . .

# Удаляем ненужные файлы из .dockerignore
RUN rm -rf node_modules dist build .env pnpm-workspace.yaml pnpm-lock.yaml 2>/dev/null || true

# Устанавливаем зависимости с bun
RUN bun install

# Собираем сервер напрямую
RUN cd packages/server && bun run build

# Запускаем сервер
EXPOSE 3000
CMD ["node", "packages/server/dist/entrypoint.js"]

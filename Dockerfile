FROM node:20-alpine

WORKDIR /app

# Устанавливаем bash, git и bun
RUN apk add --no-cache bash git && npm install -g bun@1.2.4

# Копируем конфигурационные файлы
COPY package.json bunfig.toml pnpm-workspace.yaml ./

# Устанавливаем зависимости
RUN bun install --frozen-lockfile

# Копируем весь исходный код
COPY . .

# Собираем все пакеты через turbo
RUN bun run build

# Запускаем сервер
EXPOSE 3000
CMD ["node", "packages/server/dist/entrypoint.js"]

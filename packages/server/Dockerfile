FROM node:20-alpine

WORKDIR /app

# Устанавливаем bun глобально
RUN npm install -g bun

# Копируем файлы
COPY . .

# Устанавливаем все зависимости
RUN bun install

# Собираем plugin-sql с исправлениями PGLite
RUN bun run build:plugin-sql

# Собираем сервер
RUN bun run build

# Запускаем сервер
EXPOSE 3000
CMD ["node", "packages/server/dist/index.js"]

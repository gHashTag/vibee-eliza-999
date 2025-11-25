FROM node:20-alpine

WORKDIR /app

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

# Копируем файлы
COPY . .

# Проверяем, что скопировалось
RUN ls -la

# Создаем pnpm-workspace.yaml
RUN printf "packages:\n  - 'packages/*'\n  - 'plugin-specification/*'\n" > pnpm-workspace.yaml

# Проверяем workspace
RUN cat pnpm-workspace.yaml

# Устанавливаем все зависимости в workspace
RUN pnpm install

# Собираем сервер
RUN pnpm --filter @elizaos/server run build

# Запускаем сервер
EXPOSE 3000
CMD ["node", "packages/server/dist/index.js"]

FROM node:18-alpine

WORKDIR /app

# Сначала копируем только package.json
COPY package.json ./

# Устанавливаем зависимости (не используем npm ci, так как lock файл может не совпадать)
RUN npm install

# Копируем остальные файлы
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
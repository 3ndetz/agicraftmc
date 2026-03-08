FROM node:20-alpine

# Устанавливаем build tools для нативных модулей
RUN apk add --no-cache python3 make g++

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (пересоберутся под Alpine Linux)
RUN npm ci --production

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 3000

# Команда запуска
CMD ["npm", "start"]

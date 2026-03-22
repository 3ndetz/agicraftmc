FROM node:20

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --production

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 3000

# Команда запуска
CMD ["npm", "start"]

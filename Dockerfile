FROM node:16-slim

WORKDIR /app

# Copiar primero package.json y package-lock.json
COPY package.json ./
COPY .npmrc ./

# Instalar dependencias usando npm install en lugar de npm ci
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Crear directorio para CSS si no existe
RUN mkdir -p ./public/css

# Intentar construir CSS (con || true para continuar incluso si hay errores)
RUN npm run build:css || true

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
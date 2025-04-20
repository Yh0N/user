# Usa la imagen oficial de Node.js
FROM node:18


# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto 3000
EXPOSE 5173

# Comando para correr la app con Vite
CMD ["npm", "run", "dev"]

# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Etapa de producción - Usando node:20-slim en lugar de alpine para debugging
FROM node:20-slim

WORKDIR /usr/src/app

# Instalar herramientas de debugging
RUN apt-get update && apt-get install -y curl procps && apt-get clean

# Copiamos sólo lo necesario desde la etapa de construcción
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

# No definimos PORT como variable de entorno
EXPOSE 8080

# Comando de inicio
CMD ["node", "dist/main"]
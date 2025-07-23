# Stage 1: Build frontend with Vite
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run server
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY server.js ./
COPY services/ ./services/
COPY --from=builder /app/dist ./dist/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]

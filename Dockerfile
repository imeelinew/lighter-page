FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY public ./public

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["node", "server.js"]

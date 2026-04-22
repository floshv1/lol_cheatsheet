FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY src/ ./src/

RUN addgroup -S app && adduser -S app -G app
RUN mkdir -p /data/uploads && chown -R app:app /app /data
USER app

EXPOSE 3001
CMD ["node", "src/index.js"]

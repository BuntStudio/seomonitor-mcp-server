FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY bin ./bin

RUN npm run build && npm prune --omit=dev

ENV MCP_TRANSPORT=http
ENV MCP_HTTP_PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]

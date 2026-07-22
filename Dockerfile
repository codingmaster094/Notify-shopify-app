FROM node:20-alpine
RUN apk add --no-cache openssl openssl-dev

EXPOSE 10000

WORKDIR /app

ENV NODE_ENV=production
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

COPY package.json package-lock.json* ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

CMD ["npm", "run", "docker-start"]

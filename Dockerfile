FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV COZE_PROJECT_ENV=PROD
ENV HOSTNAME=0.0.0.0
ENV PORT=5000

EXPOSE 5000

CMD ["pnpm", "start"]

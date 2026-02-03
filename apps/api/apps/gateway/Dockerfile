# 1. Base stage
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2. Installer stage
FROM base AS installer
WORKDIR /app

COPY dist/apps/gateway/package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

# 3. Runner stage
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=installer --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --chown=nestjs:nodejs dist/apps/gateway/ .

ENV PORT=3000
EXPOSE 3000

USER nestjs

CMD ["node", "main.js"]
# Debian (glibc), not Alpine: the standalone output ships the native binaries
# (sharp) traced on the glibc build machine.
FROM oven/bun:1.4.2-slim AS base
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --chown=nextjs:nodejs apps/web/.next/standalone ./

COPY --chown=nextjs:nodejs apps/web/public ./apps/web/public
COPY --chown=nextjs:nodejs apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

CMD ["bun", "apps/web/server.js"]

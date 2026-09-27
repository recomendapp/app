FROM oven/bun:1.4.2-alpine

WORKDIR /app

# drizzle-orm and pg are bundled into run-setup.cjs (build-migrator), nothing to install
COPY dist/libs/db-migrator ./

CMD ["bun", "run-setup.cjs"]

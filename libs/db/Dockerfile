FROM node:22-alpine

WORKDIR /app

RUN npm install drizzle-orm pg && npm cache clean --force

COPY dist/libs/db-migrator ./

CMD ["node", "run-setup.cjs"]
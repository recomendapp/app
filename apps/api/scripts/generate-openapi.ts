import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';
import * as fs from 'fs';
import { createDocument } from '../src/utils/docs';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as path from 'path';

async function generateOpenAPIs() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, {
    logger: false,
  });

  const outputDir = 'apps/api/.openapi';
  fs.mkdirSync(outputDir, { recursive: true });

  const document = createDocument(app);
  fs.writeFileSync(
    path.join(outputDir, `openapi.json`),
    JSON.stringify(document, null, 2),
  );
  console.log(
    `Generated OpenAPI JSON at ${path.join(outputDir, `openapi.json`)}`,
  );

  await app.close();
}

generateOpenAPIs();

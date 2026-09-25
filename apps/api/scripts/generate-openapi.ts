import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app/app.module';
import { AUTH_SERVICE } from '../src/app/auth/auth.service';
import * as fs from 'fs';
import { createDocument } from '../src/utils/docs';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as path from 'path';

async function generateOpenAPIs() {
  // better-auth runs its plugins' init() as soon as the instance is built, and
  // the oauth-provider plugin (behind mcp()) seeds `auth.oauth_resource` there,
  // which needs a live Postgres. The OpenAPI document only reads controller
  // metadata, so a stub is enough and keeps this script database-free.
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AUTH_SERVICE)
    .useValue({})
    .compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
    logger: ['error'],
  });

  const outputDir = 'apps/api/.openapi';
  fs.mkdirSync(outputDir, { recursive: true });

  const document = createDocument(app);
  fs.writeFileSync(path.join(outputDir, `openapi.json`), JSON.stringify(document, null, 2));
  console.log(`Generated OpenAPI JSON at ${path.join(outputDir, `openapi.json`)}`);

  await app.close();
}

generateOpenAPIs();

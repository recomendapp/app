import { defaultSupportedLocale, supportedLocales } from '@libs/i18n';
import { APP_PLATFORM_HEADER, APP_VERSION_HEADER, APP_PLATFORMS } from '@libs/rules';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { UpgradeRequiredErrorDto } from '../app/system/dto/upgrade-required-error.dto';

// Any route can answer 426 UPGRADE_REQUIRED via AppVersionMiddleware, so its
// error schema is forced into `components.schemas` via `extraModels` below,
// even though no single route references it directly.
const APP_VERSION_EXTRA_MODELS = [UpgradeRequiredErrorDto];

const addAppVersionDocs = (builder: DocumentBuilder) =>
  builder.addGlobalParameters(
    {
      in: 'header',
      required: false,
      name: APP_PLATFORM_HEADER,
      description: 'Calling app platform, sent by the mobile apps (and later the web app)',
      schema: { type: 'string', enum: [...APP_PLATFORMS] },
    },
    {
      in: 'header',
      required: false,
      name: APP_VERSION_HEADER,
      description: 'Calling app version, sent by the mobile apps (and later the web app)',
      schema: { type: 'string', example: '1.6.0' },
    },
  );

export const createDocument = (app: NestFastifyApplication): OpenAPIObject => {
  const config = addAppVersionDocs(
    new DocumentBuilder()
      .setTitle('Recomend API')
      .setDescription('The API documentation for the Recomend application')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // optional, arbitrary value for Swagger UI
          in: 'header',
          description: 'Enter JWT token',
        },
        'access-token', // This name is important for referencing this security scheme
      )
      .addGlobalParameters({
        in: 'header',
        required: false,
        name: 'x-language',
        description: 'Preferred language for the response',
        schema: {
          type: 'string',
          default: defaultSupportedLocale,
          enum: [...supportedLocales],
        },
      }),
  ).build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: APP_VERSION_EXTRA_MODELS,
  });
  return document;
};

export const createVersionedDocument = (
  app: NestFastifyApplication,
  version: string,
): OpenAPIObject => {
  const config = addAppVersionDocs(
    new DocumentBuilder()
      .setTitle(`API ${version}`)
      .setVersion(version)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          description: 'Enter JWT token',
        },
        'access-token',
      )
      .addGlobalParameters({
        in: 'header',
        required: false,
        name: 'x-language',
        description: 'Preferred language for the response',
        schema: {
          type: 'string',
          default: defaultSupportedLocale,
          enum: [...supportedLocales],
        },
      }),
  ).build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) => `${version}_${controllerKey}_${methodKey}`,
    extraModels: APP_VERSION_EXTRA_MODELS,
  });

  document.paths = Object.fromEntries(
    Object.entries(document.paths).filter(([path]) => {
      if (path.startsWith(`/${version}`)) return true;
      if (/^\/v\d+/.test(path)) return false;
      return true;
    }),
  );

  return document;
};

export const setupVersionedDocs = (app: NestFastifyApplication, versions: string[]) => {
  for (const version of versions) {
    const document = createVersionedDocument(app, version);

    // JSON
    app.getHttpAdapter().get(`/${version}/api-json`, (_, res) => {
      res.send(document);
    });
  }

  app.use(
    '/docs',
    apiReference({
      withFastify: true,
      theme: 'purple',
      sources: [
        ...versions.map((version) => ({
          title: version,
          url: `/${version}/api-json`,
        })),
        {
          title: 'Auth',
          url: '/auth/open-api/generate-schema',
        },
      ],
    }),
  );
};

import { defaultSupportedLocale, supportedLocales } from '@libs/i18n';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export const createDocument = (app: NestFastifyApplication): OpenAPIObject => {
  const config = new DocumentBuilder()
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
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  return document;
};

export const createVersionedDocument = (
  app: NestFastifyApplication,
  version: string,
): OpenAPIObject => {
  const config = new DocumentBuilder()
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
    })
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${version}_${controllerKey}_${methodKey}`,
  });

  document.paths = Object.fromEntries(
    Object.entries(document.paths).filter(([path]) => {
      if (path.startsWith(`/${version}`)) return true;
      if (/^\/v\d+/.test(path)) return false;
      return true;
    }),
  );

  return document;
}

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
}

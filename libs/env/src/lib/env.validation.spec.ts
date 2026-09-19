import {
  apiSchema,
  assetsSchema,
  commonSchema,
  notifySchema,
  redisSchema,
  s3Schema,
  typesenseSchema,
  validateEnv,
  workerSchema,
} from './env.validation';

describe('redisSchema', () => {
  it('defaults host/port and leaves password optional', () => {
    const result = redisSchema.parse({});
    expect(result).toEqual({
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: undefined,
    });
  });

  it('coerces REDIS_PORT from a string (as process.env always provides)', () => {
    const result = redisSchema.parse({ REDIS_PORT: '6380' });
    expect(result.REDIS_PORT).toBe(6380);
  });
});

describe('typesenseSchema', () => {
  it('requires TYPESENSE_HOST and TYPESENSE_API_KEY', () => {
    expect(typesenseSchema.safeParse({}).success).toBe(false);
    expect(
      typesenseSchema.safeParse({ TYPESENSE_HOST: 'localhost', TYPESENSE_API_KEY: 'xyz' }).success,
    ).toBe(true);
  });

  it('defaults TYPESENSE_PORT and TYPESENSE_PROTOCOL', () => {
    const result = typesenseSchema.parse({ TYPESENSE_HOST: 'localhost', TYPESENSE_API_KEY: 'xyz' });
    expect(result.TYPESENSE_PORT).toBe(8108);
    expect(result.TYPESENSE_PROTOCOL).toBe('http');
  });

  it('rejects an unsupported protocol', () => {
    const result = typesenseSchema.safeParse({
      TYPESENSE_HOST: 'localhost',
      TYPESENSE_API_KEY: 'xyz',
      TYPESENSE_PROTOCOL: 'ftp',
    });
    expect(result.success).toBe(false);
  });
});

describe('s3Schema', () => {
  const base = {
    S3_ENDPOINT: 'https://s3.example.com',
    S3_ACCESS_KEY_ID: 'key',
    S3_SECRET_ACCESS_KEY: 'secret',
  };

  it('requires a valid S3_ENDPOINT URL', () => {
    expect(s3Schema.safeParse({ ...base, S3_ENDPOINT: 'not-a-url' }).success).toBe(false);
    expect(s3Schema.safeParse(base).success).toBe(true);
  });

  it('defaults S3_REGION, S3_BUCKET and S3_IMPORTS_BUCKET', () => {
    const result = s3Schema.parse(base);
    expect(result.S3_REGION).toBe('eu-west-1');
    expect(result.S3_BUCKET).toBe('medias');
    expect(result.S3_IMPORTS_BUCKET).toBe('imports');
  });

  it('leaves S3_PUBLIC_ENDPOINT optional but validates it as a URL when present', () => {
    expect(s3Schema.safeParse(base).success).toBe(true);
    expect(s3Schema.safeParse({ ...base, S3_PUBLIC_ENDPOINT: 'not-a-url' }).success).toBe(false);
    expect(
      s3Schema.safeParse({ ...base, S3_PUBLIC_ENDPOINT: 'https://cdn.example.com' }).success,
    ).toBe(true);
  });
});

describe('commonSchema', () => {
  it('defaults NODE_ENV, LOG_LEVEL and WEB_APP_URL', () => {
    const result = commonSchema.parse({});
    expect(result.NODE_ENV).toBe('development');
    expect(result.LOG_LEVEL).toBe('info');
    expect(result.WEB_APP_URL).toBe('http://localhost:3000');
  });

  it('rejects an unsupported NODE_ENV', () => {
    expect(commonSchema.safeParse({ NODE_ENV: 'staging' }).success).toBe(false);
  });

  it('accepts every documented NODE_ENV value', () => {
    for (const value of ['development', 'production', 'test']) {
      expect(commonSchema.safeParse({ NODE_ENV: value }).success).toBe(true);
    }
  });
});

describe('assetsSchema', () => {
  it('requires a valid ASSETS_BASE_URL', () => {
    expect(assetsSchema.safeParse({}).success).toBe(false);
    expect(assetsSchema.safeParse({ ASSETS_BASE_URL: 'not-a-url' }).success).toBe(false);
    expect(assetsSchema.safeParse({ ASSETS_BASE_URL: 'https://assets.example.com' }).success).toBe(
      true,
    );
  });
});

describe('apiSchema', () => {
  const validApiEnv = {
    S3_ENDPOINT: 'https://s3.example.com',
    S3_ACCESS_KEY_ID: 'key',
    S3_SECRET_ACCESS_KEY: 'secret',
    TYPESENSE_HOST: 'localhost',
    TYPESENSE_API_KEY: 'xyz',
    ASSETS_BASE_URL: 'https://assets.example.com',
    DATABASE_URL: 'postgres://localhost/db',
    AUTH_SECRET: 'secret',
    AUTH_GOOGLE_CLIENT_ID: 'x',
    AUTH_GOOGLE_IOS_CLIENT_ID: 'x',
    AUTH_GOOGLE_ANDROID_CLIENT_ID: 'x',
    AUTH_GOOGLE_CLIENT_SECRET: 'x',
    AUTH_GITHUB_CLIENT_ID: 'x',
    AUTH_GITHUB_CLIENT_SECRET: 'x',
    AUTH_FACEBOOK_CLIENT_ID: 'x',
    AUTH_FACEBOOK_CLIENT_SECRET: 'x',
    AUTH_APPLE_CLIENT_ID: 'x',
    AUTH_APPLE_TEAM_ID: 'x',
    AUTH_APPLE_KEY_ID: 'x',
    AUTH_APPLE_PRIVATE_KEY: 'x',
    AUTH_APPLE_BUNDLE_ID: 'x',
    REVENUECAT_API_KEY: 'x',
    REVENUECAT_WEBHOOK_SECRET: 'x',
    PREFECT_API_URL: 'https://prefect.example.com',
    PREFECT_API_AUTH_STRING: 'x',
    API_INTERNAL_IMPORTS_SECRET: 'x',
  };

  it('accepts a fully-populated environment', () => {
    expect(apiSchema.safeParse(validApiEnv).success).toBe(true);
  });

  it('rejects when a required field (e.g. DATABASE_URL) is missing', () => {
    const { DATABASE_URL, ...rest } = validApiEnv;
    expect(apiSchema.safeParse(rest).success).toBe(false);
  });

  it('defaults PORT, API_URL and MOBILE_APP_SCHEME', () => {
    const result = apiSchema.parse(validApiEnv);
    expect(result.PORT).toBe(9000);
    expect(result.API_URL).toBe('https://api.recomend.app');
    expect(result.MOBILE_APP_SCHEME).toBe('recomend://');
  });
});

describe('notifySchema', () => {
  const validNotifyEnv = {
    ASSETS_BASE_URL: 'https://assets.example.com',
    S3_ENDPOINT: 'https://s3.example.com',
    DATABASE_URL: 'postgres://localhost/db',
    RESEND_API_KEY: 're_abc123',
    FIREBASE_PROJECT_ID: 'project',
    FIREBASE_CLIENT_EMAIL: 'sa@project.iam.gserviceaccount.com',
    FIREBASE_PRIVATE_KEY_B64: Buffer.from('-----BEGIN PRIVATE KEY-----').toString('base64'),
    APNS_KEY_B64: Buffer.from('-----BEGIN PRIVATE KEY-----').toString('base64'),
    APNS_KEY_ID: 'key-id',
    APNS_TEAM_ID: 'team-id',
    APNS_BUNDLE_ID: 'com.recomend.app',
  };

  it('accepts a fully-populated environment', () => {
    expect(notifySchema.safeParse(validNotifyEnv).success).toBe(true);
  });

  it('rejects a RESEND_API_KEY that does not start with re_', () => {
    const result = notifySchema.safeParse({ ...validNotifyEnv, RESEND_API_KEY: 'sk_abc123' });
    expect(result.success).toBe(false);
  });

  it('decodes FIREBASE_PRIVATE_KEY_B64 and APNS_KEY_B64 from base64 to utf-8', () => {
    const result = notifySchema.parse(validNotifyEnv);
    expect(result.FIREBASE_PRIVATE_KEY_B64).toBe('-----BEGIN PRIVATE KEY-----');
    expect(result.APNS_KEY_B64).toBe('-----BEGIN PRIVATE KEY-----');
  });

  it('only picks S3_ENDPOINT/S3_PUBLIC_ENDPOINT/S3_BUCKET from s3Schema (no S3 credentials required)', () => {
    // Deliberately not providing S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY.
    const result = notifySchema.safeParse(validNotifyEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.S3_BUCKET).toBe('medias');
    }
  });

  it('defaults RESEND_FROM_EMAIL, PORT and TMDB_IMAGE_BASE_URL', () => {
    const result = notifySchema.parse(validNotifyEnv);
    expect(result.RESEND_FROM_EMAIL).toBe('Recomend <hello@recomend.app>');
    expect(result.PORT).toBe(9001);
    expect(result.TMDB_IMAGE_BASE_URL).toBe('https://image.tmdb.org/t/p');
  });
});

describe('workerSchema', () => {
  const validWorkerEnv = {
    TYPESENSE_HOST: 'localhost',
    TYPESENSE_API_KEY: 'xyz',
    DATABASE_URL: 'postgres://localhost/db',
  };

  it('accepts a fully-populated environment', () => {
    expect(workerSchema.safeParse(validWorkerEnv).success).toBe(true);
  });

  it('rejects when DATABASE_URL is missing', () => {
    expect(
      workerSchema.safeParse({ TYPESENSE_HOST: 'localhost', TYPESENSE_API_KEY: 'xyz' }).success,
    ).toBe(false);
  });

  it('defaults PORT to 9002', () => {
    const result = workerSchema.parse(validWorkerEnv);
    expect(result.PORT).toBe(9002);
  });
});

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns the parsed environment when validation succeeds', () => {
    process.env['ASSETS_BASE_URL'] = 'https://assets.example.com';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    const result = validateEnv(assetsSchema);

    expect(result.ASSETS_BASE_URL).toBe('https://assets.example.com');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('logs the validation error and exits the process when validation fails', () => {
    delete process.env['ASSETS_BASE_URL'];
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    validateEnv(assetsSchema);

    expect(errorSpy).toHaveBeenCalledWith('❌ Invalid environment variables:', expect.anything());
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

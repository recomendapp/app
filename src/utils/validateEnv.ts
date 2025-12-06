import { cleanEnv, str, port, url } from 'envalid';

function validateEnv() {
  cleanEnv(process.env, {
    // Application
    PORT: port({ default: 3000 }),
    HOST: str({ default: '0.0.0.0' }),

    // Web App
    WEB_APP_URL: url({ default: 'http://localhost:3000' }),

    // Typesense
    TYPESENSE_HOST: str(),
    TYPESENSE_PORT: port(),
    TYPESENSE_PROTOCOL: str(),
    TYPESENSE_API_KEY: str(),

    // Supabase
    SUPABASE_URL: url(),
    SUPABASE_ANON_KEY: str(),
    SUPABASE_SERVICE_ROLE_KEY: str(),
    SUPABASE_JWT_SECRET: str(),

    // Optional
    LOG_LEVEL: str({ default: 'info' }),
  });
}

export default validateEnv;

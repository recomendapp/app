import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// --- CONFIGURATION ---
const ROOT_DIR = process.cwd();
const SCHEMA_INDEX_PATH = path.join(
  ROOT_DIR,
  'libs/db/src/lib/schemas/index.ts',
);
const AUTH_CONFIG_PATH = path.join(ROOT_DIR, 'libs/db/src/lib/auth.ts');
const OUTPUT_SCHEMA_PATH = path.join(
  ROOT_DIR,
  'libs/db/src/lib/schemas/auth.ts',
);

function toggleIndexExport(shouldComment: boolean) {
  if (!fs.existsSync(SCHEMA_INDEX_PATH)) return;

  let content = fs.readFileSync(SCHEMA_INDEX_PATH, 'utf-8');
  const exportLine = "export * from './auth';";
  const commentedLine = "// export * from './auth';";

  if (shouldComment) {
    if (content.includes(exportLine) && !content.includes(commentedLine)) {
      console.log('🔄 Commenting out auth export in index.ts...');
      content = content.replace(exportLine, commentedLine);
      fs.writeFileSync(SCHEMA_INDEX_PATH, content);
    }
  } else {
    if (content.includes(commentedLine)) {
      console.log('🔄 Restoring auth export in index.ts...');
      content = content.replace(commentedLine, exportLine);
      fs.writeFileSync(SCHEMA_INDEX_PATH, content);
    }
  }
}

function fixAuthSchemaNamespace() {
  if (!fs.existsSync(OUTPUT_SCHEMA_PATH)) return;

  console.log('️🛠️  Applying "auth" pgSchema to generated file...');
  let content = fs.readFileSync(OUTPUT_SCHEMA_PATH, 'utf-8');

  if (!content.includes('pgSchema')) {
    content = content.replace(
      '} from "drizzle-orm/pg-core";',
      ', pgSchema } from "drizzle-orm/pg-core";',
    );
  }

  if (!content.includes('export const authSchema')) {
    const importEndIndex =
      content.indexOf('drizzle-orm/pg-core";') + 'drizzle-orm/pg-core";'.length;
    content =
      content.slice(0, importEndIndex) +
      '\n\nexport const authSchema = pgSchema("auth");' +
      content.slice(importEndIndex);
  }

  content = content.split('pgTable(').join('authSchema.table(');

  fs.writeFileSync(OUTPUT_SCHEMA_PATH, content);
}

async function run() {
  try {
    toggleIndexExport(true);

    console.log('🚀 Running better-auth generate...');
    execSync(
      `npx @better-auth/cli generate --config ${AUTH_CONFIG_PATH} --output ${OUTPUT_SCHEMA_PATH} --yes`,
      { stdio: 'inherit' },
    );

    fixAuthSchemaNamespace();

    console.log('✅ Auth generation complete.');
  } catch (error) {
    console.error('❌ Error during generation:', error);
    process.exit(1);
  } finally {
    toggleIndexExport(false);
  }
}

run();

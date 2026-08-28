import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../src/lib/client';
import {
  seedExploreParadisePicture,
  seedI18n,
  seedImportSources,
  seedSystemConfig,
} from '../src/lib/seed';

async function main() {
  console.log('⏳ Starting database setup...');

  try {
    console.log('📦 Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed.');

    console.log('🌱 Starting reference data seeding...');
    await seedI18n(db);
    await seedSystemConfig(db);
    await seedExploreParadisePicture(db);
    await seedImportSources(db);
    console.log('✅ Seeding completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database setup:', error);
    process.exit(1);
  }
}

main();

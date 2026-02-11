import { db } from '../src/lib/client';
import { seedI18n } from '../src/lib/seed';

async function main() {
  console.log('🌱 Starting reference data seeding...');

  try {
    await seedI18n(db);    
    console.log('🚀 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

main();
import { DbClient } from '../client';
import { systemConfig, versionPolicy } from '../schemas/system';

export const seedSystemConfig = async (db: DbClient) => {
  console.log('Seeding system config...');

  await db
    .insert(systemConfig)
    .values([
      {
        key: 'is_maintenance',
        value: false,
      },
    ])
    .onConflictDoNothing({ target: systemConfig.key });

  // Below the app's own first-ever release, so nothing is blocked until an
  // operator (or a real release, via updateVersionPolicy) raises it. No `web`
  // row yet: nothing reads or enforces it until a web version gate ships.
  await db
    .insert(versionPolicy)
    .values([
      { platform: 'ios', version: '1.0.0', isBreaking: true, state: 'live' },
      { platform: 'android', version: '1.0.0', isBreaking: true, state: 'live' },
    ])
    .onConflictDoNothing({ target: [versionPolicy.platform, versionPolicy.version] });

  console.log('System config seeded successfully.');
};

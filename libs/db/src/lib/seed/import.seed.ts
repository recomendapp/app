import { DbClient } from '../client';
import { importSource } from '../schemas/import';

export const seedImportSources = async (db: DbClient) => {
  console.log('Seeding import sources...');

  await db
    .insert(importSource)
    .values([
      {
        provider: 'letterboxd',
        direction: 'import',
        name: 'Letterboxd',
        description: 'Import your ratings, watched films, watchlist and reviews from Letterboxd.',
        iconLight: 'providers/letterboxd-light.svg',
        iconDark: 'providers/letterboxd-dark.svg',
        instructions:
          '1. Go to [letterboxd.com/settings/data](https://letterboxd.com/settings/data/).\n' +
          '2. Click **Export your data** — the **.zip** file downloads immediately.\n' +
          "3. On Safari, downloads are automatically unzipped: if that happens, you'll need to compress the extracted folder back into a **.zip** file yourself before uploading it.\n" +
          '4. Upload the .zip file here.',
        fileTypes: ['zip', 'application/zip', 'application/x-zip-compressed', 'multipart/x-zip'],
        enabled: true,
        position: 0,
      },
    ])
    .onConflictDoNothing({ target: [importSource.provider, importSource.direction] });

  console.log('Import sources seeded successfully.');
};

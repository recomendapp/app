import { notInArray } from 'drizzle-orm';
import { DbClient } from '../client';
import { importSource } from '../schemas/import';
import { provider } from '../schemas/provider';

const PROVIDERS = [
  {
    slug: 'letterboxd',
    name: 'Letterboxd',
    description: 'Import your ratings, watched films, watchlist and reviews from Letterboxd.',
    iconLight: 'providers/letterboxd-light.svg',
    iconDark: 'providers/letterboxd-dark.svg',
    importSource: {
      instructions:
        '1. Go to [letterboxd.com/settings/data](https://letterboxd.com/settings/data/).\n' +
        '2. Click **Export your data** — the **.zip** file downloads immediately.\n' +
        "3. On Safari, downloads are automatically unzipped: if that happens, you'll need to compress the extracted folder back into a **.zip** file yourself before uploading it.\n" +
        '4. Upload the .zip file here.',
      fileTypes: ['zip', 'application/zip', 'application/x-zip-compressed', 'multipart/x-zip'],
      enabled: true,
      position: 0,
    },
  },
];

export const seedProviders = async (db: DbClient) => {
  console.log('Seeding providers...');

  for (const { importSource: importSourceData, ...providerData } of PROVIDERS) {
    const [row] = await db
      .insert(provider)
      .values(providerData)
      .onConflictDoUpdate({ target: provider.slug, set: providerData })
      .returning();

    const values = { providerId: row.id, ...importSourceData };
    await db
      .insert(importSource)
      .values(values)
      .onConflictDoUpdate({ target: importSource.providerId, set: values });
  }

  const slugs = PROVIDERS.map(({ slug }) => slug);
  await db.delete(provider).where(notInArray(provider.slug, slugs));

  console.log('Providers seeded successfully.');
};

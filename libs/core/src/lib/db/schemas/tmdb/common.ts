import { pgSchema } from 'drizzle-orm/pg-core';

export const tmdbSchema = pgSchema('tmdb');

export const imageType = tmdbSchema.enum('image_type', [
  'backdrop',
  'poster',
  'logo',
  'profile',
]);

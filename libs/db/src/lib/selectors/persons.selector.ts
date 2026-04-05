import { tmdbPersonView } from "../schemas";

export const PERSON_COMPACT_SELECT = {
  id: tmdbPersonView.id,
  name: tmdbPersonView.name,
  gender: tmdbPersonView.gender,
  profilePath: tmdbPersonView.profilePath,
  slug: tmdbPersonView.slug,
  url: tmdbPersonView.url,
};
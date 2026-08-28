import type { ComponentProps } from 'react';
import { Link } from '@/lib/i18n/navigation';

type Href = ComponentProps<typeof Link>['href'];

export const getLogMovieWatchedDatesHref = (movieIdOrSlug: number | string): Href => ({
  pathname: `/film/${movieIdOrSlug}/watched-dates`,
});

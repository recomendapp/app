import type { ComponentProps } from 'react';
import { Link } from '@/lib/i18n/navigation';

type Href = ComponentProps<typeof Link>['href'];

export const getPersonDetailsHref = (personIdOrSlug: number | string): Href => ({
  pathname: `/person/${personIdOrSlug}/details`,
});

import type { ComponentProps } from 'react';
import { Link } from '@/lib/i18n/navigation';

type Href = ComponentProps<typeof Link>['href'];

export const getRecoSendHref = (
  mediaType: 'movie' | 'tv_series',
  mediaId: number,
  mediaTitle?: string | null,
): Href => ({
  pathname: `/reco/send/${mediaType}/${mediaId}`,
  query: mediaTitle ? { mediaTitle } : undefined,
});

import type { ComponentProps } from 'react';
import { Link } from '@/lib/i18n/navigation';

type Href = ComponentProps<typeof Link>['href'];

export const getPlaylistMembersHref = (playlistId: number): Href => ({
  pathname: `/playlist/${playlistId}/edit/members`,
});

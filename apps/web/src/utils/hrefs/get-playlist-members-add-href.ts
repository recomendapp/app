import type { ComponentProps } from 'react';
import { Link } from '@/lib/i18n/navigation';

type Href = ComponentProps<typeof Link>['href'];

export const getPlaylistMembersAddHref = (playlistId: number): Href => ({
  pathname: `/playlist/${playlistId}/edit/members/add`,
});

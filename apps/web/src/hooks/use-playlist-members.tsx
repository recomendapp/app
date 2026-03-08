import { PlaylistMemberWithUser } from '@packages/api-js/src';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

const PLAYLIST_MEMBERS_ROLE: PlaylistMemberWithUser['role'][] = [
	'editor',
	'viewer',
  'admin',
];

export const usePlaylistMembers = () => {
  const t = useTranslations();

  const getPlaylistMembersRoleLabel = useCallback(
    (role: PlaylistMemberWithUser['role']): string => {
      switch (role) {
		case 'admin':
			return t('common.messages.admin', { gender: 'male', count: 1 });
        case 'editor':
          return t('common.messages.editor', { gender: 'male', count: 1 });
        case 'viewer':
        default:
          return t('common.messages.viewer', { gender: 'male', count: 1 });
      }
    },
    [t],
  );

  const playlistMembersRoleValues = useMemo(() => {
    return PLAYLIST_MEMBERS_ROLE.map((role) => ({
      value: role,
      label: getPlaylistMembersRoleLabel(role),
    }));
  }, [getPlaylistMembersRoleLabel]);

  return {
    getPlaylistMembersRoleLabel,
    playlistMembersRoleValues,
  };
};

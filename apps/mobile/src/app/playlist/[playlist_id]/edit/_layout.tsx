import { playlistOptions } from '@libs/query-client';
import { canEditPlaylist } from '@libs/api-js';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../../providers/ThemeProvider';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

const ModalPlaylistEditLayout = () => {
  const router = useRouter();
  const { defaultScreenOptions } = useTheme();
  const params = useLocalSearchParams<{ playlist_id: string }>();
  const playlistId = Number(params.playlist_id);

  const { data: playlist } = useQuery(
    playlistOptions({
      playlistId: playlistId,
    }),
  );
  const canEdit = useMemo(
    () => (playlist ? canEditPlaylist(playlist.role) : undefined),
    [playlist],
  );

  if (canEdit === false) {
    if (router.canGoBack()) {
      return <Redirect href={'..'} />;
    } else {
      return <Redirect href={'/'} />;
    }
  }
  return (
    <Stack
      screenOptions={{
        ...defaultScreenOptions,
        headerTransparent: false,
      }}
    />
  );
};

export default ModalPlaylistEditLayout;

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Button } from '../../../../../../components/ui/Button';
import { Text } from '../../../../../../components/ui/text';
import { View } from '../../../../../../components/ui/view';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../../theme/globals';
import tw from '../../../../../../lib/tw';

const PLACEHOLDER_PLAYLIST_ID = '1';

const SettingsDataImportPlaylistsScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { import_id } = useLocalSearchParams<{ import_id: string }>();

  const handleSelectPlaylist = () => {
    router.push({
      pathname: '/settings/data/import/[import_id]/playlists/[playlist_id]',
      params: { import_id, playlist_id: PLACEHOLDER_PLAYLIST_ID },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: upperFirst(t('pages.settings.data.importer.categories.playlists')),
        }}
      />
      <View
        style={[
          tw`flex-1 items-center justify-center gap-4`,
          { paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: PADDING_VERTICAL },
        ]}
      >
        <Text textColor="muted" style={tw`text-center`}>
          Here is the playlists review screen (import #{import_id})
        </Text>
        <Button variant="outline" onPress={handleSelectPlaylist}>
          Open a playlist
        </Button>
      </View>
    </>
  );
};

export default SettingsDataImportPlaylistsScreen;

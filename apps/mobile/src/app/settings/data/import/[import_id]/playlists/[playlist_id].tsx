import { Stack, useLocalSearchParams } from 'expo-router';
import { Text } from '../../../../../../components/ui/text';
import { View } from '../../../../../../components/ui/view';
import tw from '../../../../../../lib/tw';

const SettingsDataImportPlaylistItemsScreen = () => {
  const { import_id, playlist_id } = useLocalSearchParams<{
    import_id: string;
    playlist_id: string;
  }>();

  return (
    <>
      <Stack.Screen options={{ headerTitle: `Playlist #${playlist_id}` }} />
      <View style={tw`flex-1 items-center justify-center`}>
        <Text textColor="muted" style={tw`text-center`}>
          Here is the playlist items review screen (import #{import_id}, playlist #{playlist_id})
        </Text>
      </View>
    </>
  );
};

export default SettingsDataImportPlaylistItemsScreen;

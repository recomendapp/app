import { Stack, useLocalSearchParams } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import tw from '../../../../../lib/tw';

const SettingsDataImportLogMoviesScreen = () => {
  const t = useTranslations();
  const { import_id } = useLocalSearchParams<{ import_id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: upperFirst(t('pages.settings.data.importer.categories.log_movies')),
        }}
      />
      <View style={tw`flex-1 items-center justify-center`}>
        <Text textColor="muted" style={tw`text-center`}>
          Here is the log movie review screen (import #{import_id})
        </Text>
      </View>
    </>
  );
};

export default SettingsDataImportLogMoviesScreen;

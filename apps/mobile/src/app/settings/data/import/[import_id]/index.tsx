import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useMemo } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '../../../../../components/ui/Button';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import { Icons } from '../../../../../constants/Icons';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import tw from '../../../../../lib/tw';
import { useModalHeaderOptions } from '../../../../../hooks/useModalHeaderOptions';

type Category = {
  key: string;
  label: string;
  href: Href;
};

const SettingsDataImportDetailScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const modalHeaderOptions = useModalHeaderOptions();
  const { colors } = useTheme();
  const { import_id } = useLocalSearchParams<{ import_id: string }>();

  const categories = useMemo(
    (): Category[] => [
      {
        key: 'log-movies',
        label: upperFirst(t('pages.settings.data.importer.categories.log_movies')),
        href: { pathname: '/settings/data/import/[import_id]/log-movies', params: { import_id } },
      },
      {
        key: 'log-tv-series',
        label: upperFirst(t('pages.settings.data.importer.categories.log_tv_series')),
        href: {
          pathname: '/settings/data/import/[import_id]/log-tv-series',
          params: { import_id },
        },
      },
      {
        key: 'bookmarks',
        label: upperFirst(t('pages.settings.data.importer.categories.bookmarks')),
        href: { pathname: '/settings/data/import/[import_id]/bookmarks', params: { import_id } },
      },
      {
        key: 'playlists',
        label: upperFirst(t('pages.settings.data.importer.categories.playlists')),
        href: { pathname: '/settings/data/import/[import_id]/playlists', params: { import_id } },
      },
    ],
    [t, import_id],
  );

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerTitle: upperFirst(t('pages.settings.data.importer.review_title')),
        }}
      />
      <View style={{ paddingHorizontal: PADDING_HORIZONTAL, paddingTop: PADDING_VERTICAL }}>
        <Text textColor="muted" style={[tw`text-center`, { marginBottom: PADDING_VERTICAL }]}>
          Here is the import #{import_id} screen
        </Text>
        {categories.map((category, index) => (
          <Button
            key={category.key}
            variant="ghost"
            size="fit"
            onPress={() => router.push(category.href)}
            style={[
              tw`py-3`,
              index < categories.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.muted }
                : {},
            ]}
          >
            <View style={tw`flex-1 flex-row items-center justify-between`}>
              <Text>{category.label}</Text>
              <Icons.ChevronRight color={colors.mutedForeground} size={16} />
            </View>
          </Button>
        ))}
      </View>
    </>
  );
};

export default SettingsDataImportDetailScreen;

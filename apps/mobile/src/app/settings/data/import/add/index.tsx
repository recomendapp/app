import { Button } from '../../../../../components/ui/Button';
import { View } from '../../../../../components/ui/view';
import { ImageWithFallback } from '../../../../../components/utils/ImageWithFallback';
import { useModalHeaderOptions } from '../../../../../hooks/useModalHeaderOptions';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import tw from '../../../../../lib/tw';
import { LegendList } from '@legendapp/list/react-native';
import { ImportSource } from '@libs/api-js';
import { importSourcesListAllOptions } from '@libs/query-client';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'use-intl';

const SettingsDataImportAddIndexScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { mode } = useTheme();
  const modalHeaderOptions = useModalHeaderOptions();

  const { data: sources } = useQuery(importSourcesListAllOptions());
  const sortedSources = useMemo(
    () =>
      (sources ?? []).slice().sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1)),
    [sources],
  );

  const handleSelectSource = useCallback(
    (source: ImportSource) => {
      router.push({
        pathname: '/settings/data/import/add/[source]',
        params: { source: source.provider },
      });
    },
    [router],
  );

  const renderSource = useCallback(
    ({ item }: { item: ImportSource }) => (
      <Button
        variant="outline"
        disabled={!item.enabled}
        onPress={() => handleSelectSource(item)}
        style={tw`h-30 aspect-square`}
      >
        <ImageWithFallback
          source={{ uri: (mode === 'dark' ? item.iconDark : item.iconLight) ?? '' }}
          alt={item.name}
          type="service"
          contentFit="contain"
        />
      </Button>
    ),
    [mode, handleSelectSource],
  );

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerTitle: upperFirst(t('pages.settings.data.importer.select_source')),
        }}
      />
      <View style={{ paddingVertical: PADDING_VERTICAL }}>
        <LegendList
          horizontal
          data={sortedSources}
          renderItem={renderSource}
          keyExtractor={(item) => item.provider}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }}
        />
      </View>
    </>
  );
};

export default SettingsDataImportAddIndexScreen;

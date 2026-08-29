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
import { Text } from '../../../../../components/ui/text';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsDataImportAddIndexScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { mode, isLiquidGlassAvailable } = useTheme();
  const navigationHeaderHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
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
        params: { source: source.provider.slug },
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
        style={tw`h-20`}
      >
        <View style={tw`h-full aspect-square`}>
          <ImageWithFallback
            source={{
              uri: (mode === 'dark' ? item.provider.iconDark : item.provider.iconLight) ?? '',
            }}
            alt={item.provider.name}
            type="service"
            contentFit="contain"
          />
        </View>
        <Text>{item.provider.name}</Text>
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
          headerTransparent: true,
          ...(isLiquidGlassAvailable
            ? {
                headerStyle: { backgroundColor: 'transparent' },
              }
            : {}),
        }}
      />
      <View style={{ paddingVertical: PADDING_VERTICAL }}>
        <LegendList
          data={sortedSources}
          renderItem={renderSource}
          keyExtractor={(item) => item.provider.slug}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          contentContainerStyle={{
            paddingTop: navigationHeaderHeight,
            paddingBottom: insets.bottom + PADDING_VERTICAL,
            paddingHorizontal: PADDING_HORIZONTAL,
            gap: GAP,
          }}
        />
      </View>
    </>
  );
};

export default SettingsDataImportAddIndexScreen;

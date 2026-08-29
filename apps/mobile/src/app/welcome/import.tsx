import { useRouter } from 'expo-router';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { importSourcesListAllOptions } from '@libs/query-client';
import { Text } from '../../components/ui/text';
import { View } from '../../components/ui/view';
import { Button } from '../../components/ui/Button';
import { FloatingFooter } from '../../components/ui/FloatingFooter';
import { ImageWithFallback } from '../../components/utils/ImageWithFallback';
import { useTheme } from '../../providers/ThemeProvider';
import { useWelcomeFinish } from './_layout';
import tw from '../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../theme/globals';
import { LegendList } from '@legendapp/list/react-native';
import { useCallback, useMemo } from 'react';
import { ImportSource } from '@libs/api-js';

const WelcomeImportScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { mode } = useTheme();
  const finish = useWelcomeFinish();

  const { data: sources } = useQuery(importSourcesListAllOptions());
  const sortedSources = useMemo(
    () =>
      (sources ?? []).slice().sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1)),
    [sources],
  );

  const handleImport = () => {
    // finish();
    // router.dismiss();
    router.push('/settings/data/import/add');
  };

  const handleGetStarted = () => {
    finish();
    router.dismiss();
  };

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
      <View style={tw`items-center p-4 shrink-0`}>
        <Text style={tw`text-2xl font-bold text-center`}>
          {upperFirst(t('pages.welcome.import.title'))}
        </Text>
      </View>
      <LegendList
        data={sortedSources}
        renderItem={renderSource}
        keyExtractor={(item) => item.provider.slug}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: PADDING_VERTICAL,
          paddingHorizontal: PADDING_HORIZONTAL,
          gap: GAP,
        }}
      />
      <FloatingFooter>
        <View style={{ width: '100%', gap: GAP }}>
          <Button size="lg" containerStyle={tw`w-full`} onPress={handleImport}>
            {upperFirst(t('common.messages.import'))}
          </Button>
          <Button variant="ghost" size="lg" containerStyle={tw`w-full`} onPress={handleGetStarted}>
            {upperFirst(t('common.messages.get_started'))}
          </Button>
        </View>
      </FloatingFooter>
    </>
  );
};

export default WelcomeImportScreen;

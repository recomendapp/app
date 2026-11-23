import { CardFeedPersonMovie } from '../../../../components/cards/feed/CardFeedPersonMovie';
import { CardFeedPersonTvSeries } from '../../../../components/cards/feed/CardFeedPersonTvSeries';
import { Button } from '../../../../components/ui/Button';
import { LoopCarousel } from '../../../../components/ui/LoopCarousel';
import { Text } from '../../../../components/ui/text';
import { View } from '../../../../components/ui/view';
import app from '../../../../constants/app';
import { Icons } from '../../../../constants/Icons';
import tw from '../../../../lib/tw';
import { useAuth } from '../../../../providers/AuthProvider';
import { useTheme } from '../../../../providers/ThemeProvider';
import { LegendList } from '@legendapp/list/react-native';
import Color from 'color';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'use-intl';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { userFeedPersonsInfiniteOptions } from '@libs/query-client';
import { FeedPersonItem } from '@libs/api-js';
import { uiBackgroundsOptions } from '../../../../api/ui/uiOptions';
import { RefreshableStateContainer } from '../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../components/cards/CardError';
import { CardEmpty } from '../../../../components/cards/CardEmpty';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CastCrewFeedScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const { data: backgrounds } = useQuery(uiBackgroundsOptions());
  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching, isError } =
    useInfiniteQuery({
      ...userFeedPersonsInfiniteOptions({
        userId: user?.id,
      }),
      enabled: !!user?.isPremium,
    });
  const feed = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);
  // Render
  const renderItem = useCallback(
    ({ item }: { item: FeedPersonItem }) => {
      switch (item.type) {
        case 'movie':
          return <CardFeedPersonMovie data={item} />;
        case 'tv_series':
          return <CardFeedPersonTvSeries data={item} />;
        default:
          return (
            <View
              style={[
                { backgroundColor: colors.muted },
                {
                  borderRadius: theme.border.radius.md,
                  paddingVertical: theme.spaces.md,
                  paddingHorizontal: theme.spaces.horizontal,
                },
              ]}
            >
              <Text textColor="muted" style={tw`text-center`}>
                Unsupported media type
              </Text>
            </View>
          );
      }
    },
    [colors.muted, theme],
  );
  const keyExtractor = useCallback(
    (item: FeedPersonItem) => `${item.media.id}:${item.type}-${item.person.id}`,
    [],
  );
  const onEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  if (user === undefined) {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center`,
          { paddingTop: theme.spaces.md, paddingBottom: insets.bottom + theme.spaces.md },
        ]}
      >
        <Icons.Loader />
      </View>
    );
  }
  if (user?.isPremium === false) {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center`,
          { paddingTop: theme.spaces.md, paddingBottom: insets.bottom + theme.spaces.md },
        ]}
      >
        {backgrounds && (
          <View style={tw`absolute inset-0`}>
            <LoopCarousel
              items={backgrounds}
              containerStyle={tw`flex-1`}
              renderItem={(item) => (
                <Image source={item.localUri} contentFit="cover" style={tw`absolute inset-0`} />
              )}
            />
            <LinearGradient
              colors={[Color(colors.background).hex(), 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }}
            />
            <LinearGradient
              colors={['transparent', Color(colors.background).hex()]}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%' }}
            />
          </View>
        )}
        <Button
          icon={Icons.premium}
          iconProps={{
            color: colors.accentBlue,
          }}
          onPress={() =>
            router.push({
              pathname: '/upgrade',
              params: {
                feature: app.features.feed_cast_crew,
              },
            })
          }
        >
          {upperFirst(t('common.messages.upgrade_to_plan', { plan: 'Premium' }))}
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
      >
        <Icons.Loader />
      </RefreshableStateContainer>
    );
  }

  if (isError) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
      >
        <CardError />
      </RefreshableStateContainer>
    );
  }

  if (feed.length === 0) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
      >
        <CardEmpty icon={'⚡️'} label={t('help_hints.feed_person.message')} />
      </RefreshableStateContainer>
    );
  }

  return (
    <>
      <LegendList
        data={feed}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: theme.spaces.md,
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          paddingBottom: insets.bottom + theme.spaces.md,
          gap: theme.spaces.md,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{
          bottom: insets.bottom,
        }}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        nestedScrollEnabled
        onRefresh={refetch}
      />
    </>
  );
};

export default CastCrewFeedScreen;

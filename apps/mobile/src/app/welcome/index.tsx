import { useCallback, useMemo, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { Text } from '../../components/ui/text';
import { View } from '../../components/ui/view';
import { Button } from '../../components/ui/Button';
import { FloatingFooter } from '../../components/ui/FloatingFooter';
import { useTheme } from '../../providers/ThemeProvider';
import tw from '../../lib/tw';
import { BORDER_RADIUS_FULL, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../theme/globals';
import Color from 'color';
import { useQuery } from '@tanstack/react-query';
import { uiFeaturesOptions } from '@libs/query-client';
import { UiFeature } from '@libs/api-js';
import { uiBackgroundsOptions } from '../../api/ui/uiOptions';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { LoopCarousel } from '../../components/ui/LoopCarousel';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Icons } from '../../constants/Icons';
import { isAndroid } from '../../platform/detection';

const WelcomeBackground = () => {
  const { colors } = useTheme();
  const bgColor = useMemo(() => Color(colors.background).rgb().object(), [colors.background]);
  const { data } = useQuery(uiBackgroundsOptions());
  return (
    <View style={tw`absolute inset-0`}>
      {data && (
        <LoopCarousel
          items={data}
          containerStyle={tw`flex-1`}
          renderItem={(item) => (
            <Image source={item.localUri} contentFit="cover" style={tw`absolute inset-0`} />
          )}
        />
      )}
      <LinearGradient
        style={tw`absolute inset-0`}
        colors={[
          `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.6)`,
          `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.8)`,
          `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 1)`,
        ]}
      />
    </View>
  );
};

const FeatureSlide = ({
  feature,
  width,
  height,
}: {
  feature: UiFeature;
  width: number;
  height: number;
}) => {
  const player = useVideoPlayer(feature.video.mobile, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={[tw`items-center justify-center gap-4`, { width, height }]}>
      <View
        style={[
          { aspectRatio: 3 / 4, width: width * 0.6, backgroundColor: 'black' },
          tw`rounded-2xl overflow-hidden`,
        ]}
      >
        <Image
          source={{ uri: feature.poster.mobile }}
          contentFit="cover"
          style={tw`absolute inset-0`}
        />
        <VideoView
          player={player}
          style={tw`absolute inset-0`}
          contentFit="cover"
          nativeControls={false}
          pointerEvents="none"
        />
      </View>
      <Text style={tw`text-2xl font-bold text-center`}>{upperFirst(feature.label)}</Text>
      <Text textColor="muted" style={tw`text-center max-w-xs`}>
        {upperFirst(feature.description)}
      </Text>
    </View>
  );
};

const WelcomeCarouselScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { colors } = useTheme();
  const navigationHeaderHeight = useHeaderHeight();

  const { data: features } = useQuery(uiFeaturesOptions());

  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const [carouselSpace, setCarouselSpace] = useState<{ width: number; height: number } | undefined>(
    undefined,
  );

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: UiFeature }) => {
      if (carouselSpace === undefined) return <></>;
      return (
        <FeatureSlide feature={item} width={carouselSpace?.width} height={carouselSpace?.height} />
      );
    },
    [carouselSpace],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: () => <></>,
          headerStyle: { backgroundColor: 'transparent' },
          headerLeft: isAndroid ? () => <></> : undefined,
        }}
      />
      <View style={tw`flex-1`}>
        <WelcomeBackground />
        <View
          style={{
            paddingTop: navigationHeaderHeight,
            paddingHorizontal: PADDING_HORIZONTAL,
            paddingBottom: PADDING_VERTICAL,
          }}
        >
          <Text style={tw`text-3xl font-bold text-center`}>
            {upperFirst(t('pages.welcome.title'))}
          </Text>
          <Text textColor="muted" style={[tw`text-center`, { marginTop: 8 }]}>
            {t('pages.welcome.description', { app: 'Recomend' })}
          </Text>
        </View>
        <View
          style={tw`flex-1`}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setCarouselSpace({ width, height });
          }}
        >
          {features && carouselSpace !== undefined ? (
            <Carousel
              ref={ref}
              width={carouselSpace.width}
              height={carouselSpace.height}
              data={features ?? []}
              onProgressChange={progress}
              renderItem={renderItem}
              autoPlay={true}
              autoPlayInterval={15000}
              style={{ overflow: 'visible' }}
            />
          ) : (
            <View style={tw`flex-1 items-center justify-center`}>
              <Icons.Loader />
            </View>
          )}
        </View>
        <Pagination.Basic
          progress={progress}
          data={features ?? []}
          dotStyle={{ backgroundColor: colors.muted, borderRadius: BORDER_RADIUS_FULL }}
          activeDotStyle={{
            backgroundColor: colors.accentYellow,
            borderRadius: BORDER_RADIUS_FULL,
          }}
          containerStyle={{
            gap: 5,
            paddingBottom: PADDING_VERTICAL,
            paddingHorizontal: PADDING_HORIZONTAL,
          }}
          onPress={onPressPagination}
        />
      </View>
      <FloatingFooter>
        <Button
          size="lg"
          containerStyle={tw`w-full`}
          onPress={() => router.push('/welcome/follow')}
        >
          {upperFirst(t('common.messages.next'))}
        </Button>
      </FloatingFooter>
    </>
  );
};

export default WelcomeCarouselScreen;

import { userByUsernameOptions, userTvSeriesLogOptions } from '@libs/query-client';
import { useQuery } from '@tanstack/react-query';
import AnimatedContentContainer from '../../../ui/AnimatedContentContainer';
import AnimatedStackScreen from '../../../ui/AnimatedStackScreen';
import { useTheme } from '../../../../providers/ThemeProvider';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../theme/globals';
import {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ProfileTvSeriesHeader } from './ProfileTvSeriesHeader';
import { View } from '../../../ui/view';
import tw from '../../../../lib/tw';
import { Text } from '../../../ui/text';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Button } from '../../../ui/Button';
import { Icons } from '../../../../constants/Icons';
import useBottomSheetStore from '../../../../stores/useBottomSheetStore';
import ButtonUserReviewTvSeriesLike from '../../../buttons/ButtonUserReviewTvSeriesLike';
import { BottomSheetLogTvSeries } from '../../../bottom-sheets/sheets/BottomSheetLogTvSeries';
import FeedUserLog from '../../feed/FeedUserLog';
import { EnrichedMarkdownText } from '../../../RichText/EnrichedMarkdownText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCompactCount } from '../../../../utils/formatCompactCount';
import { AnimatedPressable } from '../../../ui/AnimatedPressable';

export const ProfileTvSeries = ({
  username,
  tvSeriesId,
}: {
  username: string;
  tvSeriesId: number;
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations();
  const router = useRouter();
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  // Queries
  const { data: profile } = useQuery(
    userByUsernameOptions({
      username: username,
    }),
  );
  const { data: log, isLoading } = useQuery(
    userTvSeriesLogOptions({
      userId: profile?.id,
      tvSeriesId,
    }),
  );
  const openComments = () => {
    router.push({
      pathname: '/user/[username]/tv-series/[tv_series_id]/comments',
      params: { username, tv_series_id: tvSeriesId },
    });
  };

  // SharedValue
  const headerHeight = useSharedValue<number>(0);
  const scrollY = useSharedValue<number>(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const animatedContentContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: withTiming(insets.bottom + PADDING_VERTICAL, { duration: 300 }),
    };
  });
  return (
    <>
      <AnimatedStackScreen
        options={{
          headerTitle: log?.tvSeries.name || '',
          headerTransparent: true,
          headerRight: () => (
            <>
              <Button
                variant="ghost"
                size="icon"
                icon={Icons.EllipsisVertical}
                onPress={() => {
                  if (log) {
                    openSheet(BottomSheetLogTvSeries, {
                      log: log,
                      profile: log.user,
                    });
                  }
                }}
              />
            </>
          ),
          unstable_headerRightItems: () => [
            {
              type: 'button',
              label: upperFirst(t('common.messages.menu')),
              onPress: () => {
                if (log) {
                  openSheet(BottomSheetLogTvSeries, {
                    log: log,
                    profile: log.user,
                  });
                }
              },
              icon: {
                name: 'ellipsis',
                type: 'sfSymbol',
              },
            },
          ],
        }}
        scrollY={scrollY}
        triggerHeight={headerHeight}
      />
      <AnimatedContentContainer
        onScroll={scrollHandler}
        scrollToOverflowEnabled
        contentContainerStyle={animatedContentContainerStyle}
      >
        <ProfileTvSeriesHeader
          log={log}
          loading={isLoading}
          scrollY={scrollY}
          triggerHeight={headerHeight}
        />
        {log && (
          <View
            style={{
              paddingLeft: insets.left + PADDING_HORIZONTAL,
              paddingRight: insets.right + PADDING_HORIZONTAL,
              paddingVertical: PADDING_VERTICAL,
            }}
          >
            {log.review ? (
              <>
                <View style={tw`justify-center items-center`}>
                  <Text
                    variant="heading"
                    style={[{ color: colors.accentYellow }, tw`text-center my-2`]}
                  >
                    {log.review.title ||
                      upperFirst(t('common.messages.review_by', { name: log.user.username }))}
                  </Text>
                </View>
                <EnrichedMarkdownText markdown={log.review.body} />
                <View style={tw`flex-row items-center gap-3 mt-3`}>
                  <ButtonUserReviewTvSeriesLike review={log.review} compact />
                  <AnimatedPressable
                    onPress={openComments}
                    hitSlop={8}
                    style={tw`flex-row items-center gap-1 py-1`}
                  >
                    <Icons.Comment size={14} color={colors.mutedForeground} />
                    {log.review.commentsCount > 0 && (
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {formatCompactCount(log.review.commentsCount)}
                      </Text>
                    )}
                  </AnimatedPressable>
                </View>
              </>
            ) : (
              <FeedUserLog author={log?.user} log={log} />
            )}
          </View>
        )}
      </AnimatedContentContainer>
    </>
  );
};

import {
  userByUsernameOptions,
  userMovieLogOptions,
  useUserReviewMovieLike,
} from '@libs/query-client';
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
import { ProfileFilmHeader } from './ProfileFilmHeader';
import { View } from '../../../ui/view';
import tw from '../../../../lib/tw';
import { Text } from '../../../ui/text';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Button } from '../../../ui/Button';
import { Icons } from '../../../../constants/Icons';
import useBottomSheetStore from '../../../../stores/useBottomSheetStore';
import ButtonUserReviewMovieLike from '../../../buttons/ButtonUserReviewMovieLike';
import { useAuth } from '../../../../providers/AuthProvider';
import { NativeStackHeaderItem } from '@react-navigation/native-stack';
import { BottomSheetLogMovie } from '../../../bottom-sheets/sheets/BottomSheetLogMovie';
import FeedUserLog from '../../feed/FeedUserLog';
import { EnrichedMarkdownText } from '../../../RichText/EnrichedMarkdownText';

export const ProfileFilm = ({ username, movieId }: { username: string; movieId: number }) => {
  const { user } = useAuth();
  const { colors, bottomOffset, tabBarHeight } = useTheme();
  const t = useTranslations();
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  // Queries
  const { data: profile } = useQuery(
    userByUsernameOptions({
      username: username,
    }),
  );
  const { data: log, isLoading } = useQuery(
    userMovieLogOptions({
      userId: profile?.id,
      movieId,
    }),
  );
  const { isLiked, toggle } = useUserReviewMovieLike({
    userId: user?.id,
    reviewId: log?.review?.id,
  });

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
      paddingBottom: withTiming(bottomOffset + PADDING_VERTICAL * 2, { duration: 300 }),
    };
  });
  return (
    <>
      <AnimatedStackScreen
        options={{
          headerTitle: log?.movie.title || '',
          headerTransparent: true,
          headerRight: () => (
            <>
              {log?.review && (
                <ButtonUserReviewMovieLike variant="ghost" reviewId={log.review.id} />
              )}
              <Button
                variant="ghost"
                size="icon"
                icon={Icons.EllipsisVertical}
                onPress={() => {
                  if (log) {
                    openSheet(BottomSheetLogMovie, {
                      log: log,
                      profile: log.user,
                    });
                  }
                }}
              />
            </>
          ),
          unstable_headerRightItems: (props) => [
            ...(log?.review
              ? ([
                  {
                    type: 'button',
                    label: upperFirst(t('common.messages.like')),
                    onPress: toggle,
                    icon: {
                      name: isLiked ? 'heart.fill' : 'heart',
                      type: 'sfSymbol',
                    },
                    tintColor: isLiked ? colors.accentPink : undefined,
                  },
                ] satisfies NativeStackHeaderItem[])
              : []),
            {
              type: 'button',
              label: upperFirst(t('common.messages.menu')),
              onPress: () => {
                if (log) {
                  openSheet(BottomSheetLogMovie, {
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
        scrollIndicatorInsets={{
          bottom: tabBarHeight,
        }}
      >
        <ProfileFilmHeader
          log={log}
          loading={isLoading}
          scrollY={scrollY}
          triggerHeight={headerHeight}
        />
        {log && (
          <View style={{ paddingHorizontal: PADDING_HORIZONTAL }}>
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

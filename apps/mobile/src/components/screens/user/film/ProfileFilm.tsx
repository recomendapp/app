import { userByUsernameOptions, userMovieLogOptions } from '@libs/query-client';
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
import { BottomSheetLogMovie } from '../../../bottom-sheets/sheets/BottomSheetLogMovie';
import FeedUserLog from '../../feed/FeedUserLog';
import { EnrichedMarkdownText } from '../../../RichText/EnrichedMarkdownText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { formatCompactCount } from '../../../../utils/formatCompactCount';

export const ProfileFilm = ({ username, movieId }: { username: string; movieId: number }) => {
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
    userMovieLogOptions({
      userId: profile?.id,
      movieId,
    }),
  );
  const openComments = () => {
    router.push({
      pathname: '/user/[username]/film/[film_id]/comments',
      params: { username, film_id: movieId },
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
          headerTitle: log?.movie.title || '',
          headerTransparent: true,
          headerRight: () => (
            <>
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
          unstable_headerRightItems: () => [
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
      >
        <ProfileFilmHeader
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
                  <ButtonUserReviewMovieLike review={log.review} compact />
                  <Pressable
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
                  </Pressable>
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

import { useCallback, useRef, useState } from 'react';
import { Pressable, TextInput, View as RNView } from 'react-native';
import { KeyboardGestureArea, KeyboardStickyView } from 'react-native-keyboard-controller';
import {
  KeyboardAwareLegendList,
  useKeyboardChatComposerInset,
  useKeyboardScrollToEnd,
} from '@legendapp/list/keyboard';
import { LegendListRef } from '@legendapp/list/react-native';
import { useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { GlassView } from 'expo-glass-effect';
import {
  userByUsernameOptions,
  userTvSeriesLogOptions,
  reviewTvSeriesCommentsInfiniteOptions,
  useReviewTvSeriesCommentCreateMutation,
} from '@libs/query-client';
import { View } from '../../../ui/view';
import { Text } from '../../../ui/text';
import { Button } from '../../../ui/Button';
import { Icons } from '../../../../constants/Icons';
import { useAuth } from '../../../../providers/AuthProvider';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useToast } from '../../../Toast';
import { CardEmpty } from '../../../cards/CardEmpty';
import { CardError } from '../../../cards/CardError';
import { useModalHeaderOptions } from '../../../../hooks/useModalHeaderOptions';
import {
  BORDER_RADIUS_LG,
  GAP,
  GAP_LG,
  PADDING_HORIZONTAL,
  PADDING_VERTICAL,
} from '../../../../theme/globals';
import tw from '../../../../lib/tw';
import { CommentItem, ReviewComment } from './CommentItem';

export const ReviewTvSeriesCommentsScreen = ({
  username,
  tvSeriesId,
}: {
  username: string;
  tvSeriesId: number;
}) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const navigationHeaderHeight = useHeaderHeight();
  const { colors, isLiquidGlassAvailable } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });

  const listRef = useRef<LegendListRef>(null);
  const composerRef = useRef<RNView>(null);

  const [body, setBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReviewComment | null>(null);

  const { contentInsetEndAdjustment: composerHeight, onComposerLayout } =
    useKeyboardChatComposerInset(listRef, composerRef, 60);
  const { freeze } = useKeyboardScrollToEnd({ listRef });
  const listBottomInset = useDerivedValue(
    () => insets.bottom + composerHeight.value + PADDING_VERTICAL * 2,
  );

  const { data: profile } = useQuery(userByUsernameOptions({ username }));
  const { data: log } = useQuery(userTvSeriesLogOptions({ userId: profile?.id, tvSeriesId }));
  const reviewId = log?.review?.id;
  const reviewAuthorId = profile?.id;

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
  } = useInfiniteQuery(reviewTvSeriesCommentsInfiniteOptions({ reviewId }));
  const comments = data?.pages.flatMap((page) => page.data) ?? [];

  const { mutateAsync: createComment, isPending: isSending } =
    useReviewTvSeriesCommentCreateMutation({
      tvSeriesId,
      reviewAuthorId: reviewAuthorId ?? '',
    });

  const handleReply = useCallback((comment: ReviewComment) => {
    setReplyingTo(comment);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || !reviewId || isSending) return;
    try {
      await createComment({
        path: { review_id: reviewId },
        body: { body: trimmed, parentId: replyingTo?.id },
      });
      setBody('');
      setReplyingTo(null);
      // New comments/replies are prepended (newest first), so "landing" on
      // them means scrolling back up to the top, not to the end.
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch {
      toast.error(upperFirst(t('common.messages.error')), {
        description: upperFirst(t('common.messages.an_error_occurred')),
      });
    }
  }, [body, reviewId, isSending, createComment, replyingTo, toast, t]);

  const renderItem = useCallback(
    ({ item }: { item: ReviewComment }) =>
      reviewId && reviewAuthorId ? (
        <CommentItem
          type="tv-series"
          reviewId={reviewId}
          reviewAuthorId={reviewAuthorId}
          mediaId={tvSeriesId}
          comment={item}
          onReply={handleReply}
        />
      ) : null,
    [reviewId, reviewAuthorId, tvSeriesId, handleReply],
  );

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerTransparent: true,
          ...(isLiquidGlassAvailable
            ? {
                headerStyle: { backgroundColor: 'transparent' },
              }
            : {}),
          title: upperFirst(t('common.messages.comment', { count: 2 })),
        }}
      />
      <KeyboardGestureArea interpolator="ios" offset={insets.bottom} style={tw`flex-1`}>
        <KeyboardAwareLegendList
          ref={listRef}
          data={comments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={{ height: GAP_LG }} />}
          ListEmptyComponent={
            <View style={tw`flex-1 items-center justify-center`}>
              {isLoading ? (
                <Icons.Loader />
              ) : isError ? (
                <CardError />
              ) : (
                <CardEmpty icon={'💬'} label={upperFirst(t('common.messages.no_comment'))} />
              )}
            </View>
          }
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View style={tw`py-2`}>
                <Icons.Loader />
              </View>
            ) : null
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            paddingHorizontal: PADDING_HORIZONTAL,
          }}
          contentInset={{
            top: navigationHeaderHeight + PADDING_VERTICAL,
          }}
          refreshing={isRefetching}
          onRefresh={refetch}
          maintainVisibleContentPosition
          keyboardShouldPersistTaps="handled"
          contentInsetEndAdjustment={listBottomInset}
          freeze={freeze}
          keyboardDismissMode="interactive"
          keyboardOffset={insets.bottom}
        />
      </KeyboardGestureArea>

      {user && (
        <KeyboardStickyView
          offset={{ closed: -(GAP + insets.bottom), opened: -GAP }}
          style={[tw`absolute left-0 right-0 overflow-hidden`, { bottom: 0 }]}
        >
          <RNView ref={composerRef} onLayout={onComposerLayout}>
            <GlassView
              style={[
                {
                  borderRadius: BORDER_RADIUS_LG,
                  paddingVertical: PADDING_VERTICAL,
                  paddingHorizontal: PADDING_HORIZONTAL,
                  marginHorizontal: PADDING_HORIZONTAL,
                  gap: GAP,
                  backgroundColor: !isLiquidGlassAvailable ? colors.muted : 'transparent',
                  borderWidth: !isLiquidGlassAvailable ? 1 : 0,
                  borderColor: !isLiquidGlassAvailable ? colors.border : 'transparent',
                },
              ]}
            >
              {replyingTo && (
                <View
                  style={[
                    tw`flex-row items-center justify-between gap-2 rounded-lg px-2 py-1`,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Text numberOfLines={1} textColor="muted" style={{ fontSize: 12, flex: 1 }}>
                    {upperFirst(t('common.messages.reply'))} @{replyingTo.author.username}
                  </Text>
                  <Pressable onPress={() => setReplyingTo(null)} hitSlop={8}>
                    <Icons.X size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              )}
              <View style={tw`flex-row items-center`}>
                <TextInput
                  placeholder={upperFirst(t('common.messages.write_your_comment_here'))}
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="sentences"
                  value={body}
                  onChangeText={setBody}
                  editable={!isSending}
                  multiline
                  style={[
                    tw`shrink flex-grow`,
                    { minHeight: 40, maxHeight: 120, color: colors.foreground, padding: 10 },
                  ]}
                />
                <Button
                  icon={Icons.Reco}
                  variant="ghost"
                  style={tw`rounded-full`}
                  containerStyle={tw`shrink-0`}
                  size="icon"
                  disabled={!body.trim() || isSending || !reviewId}
                  onPress={handleSend}
                />
              </View>
            </GlassView>
          </RNView>
        </KeyboardStickyView>
      )}
    </>
  );
};

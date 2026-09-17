import { useCallback, useMemo, useRef, useState } from 'react';
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
import { Stack } from 'expo-router';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { GlassView } from 'expo-glass-effect';
import {
  userByUsernameOptions,
  userMovieLogOptions,
  reviewMovieCommentsInfiniteOptions,
  useReviewMovieCommentCreateMutation,
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
import { CommentRepliesLoader, RepliesState } from './CommentReplies';
import { useHeaderHeight } from 'expo-router/react-navigation';

// Avatar (32) + its gap (8) in CommentItem - replies are a flat sibling row
// here, not nested inside the parent's own layout, so they need to redo
// that same offset by hand to line up under the parent's text.
const REPLY_INDENT = 40;

type FlatRow =
  | { kind: 'comment'; key: string; comment: ReviewComment }
  | { kind: 'reply'; key: string; comment: ReviewComment; parentId: number }
  | { kind: 'load-more-replies'; key: string; parentId: number }
  | { kind: 'replies-loading'; key: string; parentId: number };

export const ReviewMovieCommentsScreen = ({
  username,
  movieId,
}: {
  username: string;
  movieId: number;
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const navigationHeaderHeight = useHeaderHeight();
  const { colors, isLiquidGlassAvailable } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });

  const listRef = useRef<LegendListRef>(null);
  const composerRef = useRef<RNView>(null);
  const inputRef = useRef<TextInput>(null);

  const [body, setBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReviewComment | null>(null);
  const [expandedParentIds, setExpandedParentIds] = useState<Record<number, boolean>>({});
  const [repliesByParent, setRepliesByParent] = useState<Record<number, RepliesState>>({});

  const { contentInsetEndAdjustment: composerHeight, onComposerLayout } =
    useKeyboardChatComposerInset(listRef, composerRef, 60);
  const { freeze } = useKeyboardScrollToEnd({ listRef });
  const listBottomInset = useDerivedValue(
    () => insets.bottom + composerHeight.value + PADDING_VERTICAL * 2,
  );

  const { data: profile } = useQuery(userByUsernameOptions({ username }));
  const { data: log } = useQuery(userMovieLogOptions({ userId: profile?.id, movieId }));
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
  } = useInfiniteQuery(reviewMovieCommentsInfiniteOptions({ reviewId }));
  const comments = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const { mutateAsync: createComment, isPending: isSending } = useReviewMovieCommentCreateMutation({
    movieId,
    reviewAuthorId: reviewAuthorId ?? '',
  });

  const handleReply = useCallback((comment: ReviewComment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  }, []);

  const handleToggleReplies = useCallback((comment: ReviewComment) => {
    setExpandedParentIds((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }));
  }, []);

  const handleRepliesChange = useCallback((parentId: number, state: RepliesState) => {
    setRepliesByParent((prev) => ({ ...prev, [parentId]: state }));
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || !reviewId || isSending) return;
    try {
      const parentId = replyingTo?.id;
      await createComment({
        path: { review_id: reviewId },
        body: { body: trimmed, parentId },
      });
      setBody('');
      setReplyingTo(null);
      if (parentId) {
        // Land on the thread you just replied to instead of leaving it collapsed.
        setExpandedParentIds((prev) => ({ ...prev, [parentId]: true }));
      } else {
        // New top-level comments are prepended (newest first), so "landing"
        // on them means scrolling back up to the top, not to the end.
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch {
      toast.error(upperFirst(t('common.messages.error')), {
        description: upperFirst(t('common.messages.an_error_occurred')),
      });
    }
  }, [body, reviewId, isSending, createComment, replyingTo, toast, t]);

  const expandedIds = useMemo(
    () => Object.keys(expandedParentIds).filter((id) => expandedParentIds[Number(id)]),
    [expandedParentIds],
  );

  const flatData = useMemo(() => {
    const rows: FlatRow[] = [];
    for (const comment of comments) {
      rows.push({ kind: 'comment', key: `c-${comment.id}`, comment });
      if (!expandedParentIds[comment.id]) continue;

      const repliesState = repliesByParent[comment.id];
      if (!repliesState || (repliesState.isLoading && repliesState.replies.length === 0)) {
        rows.push({ kind: 'replies-loading', key: `rl-${comment.id}`, parentId: comment.id });
        continue;
      }

      for (const reply of repliesState.replies) {
        rows.push({ kind: 'reply', key: `r-${reply.id}`, comment: reply, parentId: comment.id });
      }
      if (repliesState.hasNextPage) {
        rows.push({
          kind: 'load-more-replies',
          key: `lm-${comment.id}`,
          parentId: comment.id,
        });
      }
    }
    return rows;
  }, [comments, expandedParentIds, repliesByParent]);

  const renderItem = useCallback(
    ({ item }: { item: FlatRow }) => {
      if (!reviewId || !reviewAuthorId) return null;

      if (item.kind === 'comment') {
        return (
          <CommentItem
            type="movie"
            reviewId={reviewId}
            reviewAuthorId={reviewAuthorId}
            mediaId={movieId}
            comment={item.comment}
            onReply={handleReply}
            repliesExpanded={!!expandedParentIds[item.comment.id]}
            onToggleReplies={handleToggleReplies}
          />
        );
      }

      if (item.kind === 'reply') {
        return (
          <View
            style={[tw`pl-3 border-l-2`, { marginLeft: REPLY_INDENT, borderColor: colors.border }]}
          >
            <CommentItem
              type="movie"
              reviewId={reviewId}
              reviewAuthorId={reviewAuthorId}
              mediaId={movieId}
              comment={item.comment}
              isReply
            />
          </View>
        );
      }

      if (item.kind === 'replies-loading') {
        return (
          <View style={{ marginLeft: REPLY_INDENT + 12 }}>
            <Icons.Loader />
          </View>
        );
      }

      const repliesState = repliesByParent[item.parentId];
      return (
        <View style={{ marginLeft: REPLY_INDENT + 12 }}>
          {repliesState?.isFetchingNextPage ? (
            <Icons.Loader />
          ) : (
            <Pressable onPress={() => repliesState?.fetchNextPage()} hitSlop={8}>
              <Text textColor="muted" style={{ fontSize: 12, fontWeight: '600' }}>
                {upperFirst(t('common.messages.load_more_replies'))}
              </Text>
            </Pressable>
          )}
        </View>
      );
    },
    [
      reviewId,
      reviewAuthorId,
      movieId,
      handleReply,
      handleToggleReplies,
      expandedParentIds,
      repliesByParent,
      colors.border,
      t,
    ],
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
      {reviewId &&
        expandedIds.map((id) => (
          <CommentRepliesLoader
            key={id}
            type="movie"
            reviewId={reviewId}
            parentId={Number(id)}
            onChange={handleRepliesChange}
          />
        ))}
      <KeyboardGestureArea interpolator="ios" offset={insets.bottom} style={tw`flex-1`}>
        <KeyboardAwareLegendList
          ref={listRef}
          data={flatData}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
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
                  ref={inputRef}
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

import tw from '../../../lib/tw';
import { useTheme } from '../../../providers/ThemeProvider';
import { Href, Link } from 'expo-router';
import { Pressable, StyleProp, View, ViewStyle, Alert } from 'react-native';
import { useTranslations } from 'use-intl';
import { useQuery } from '@tanstack/react-query';
import {
  userPinnedOptions,
  useUserPinnedDeleteMutation,
  useUserPinnedReorderMutation,
} from '@libs/query-client';
import { useCallback, useEffect, useState } from 'react';
import DraggableFlatList, {
  DragEndParams,
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useToast } from '../../Toast';
import { ImageWithFallback } from '../../utils/ImageWithFallback';
import { getTmdbImage } from '../../../lib/tmdb/getTmdbImage';
import { Text } from '../../ui/text';
import { useAuth } from '../../../providers/AuthProvider';
import { withHaptic } from '../../../utils/with-haptic';
import { Icons } from '../../../constants/Icons';
import { Button } from '../../ui/Button';
import Animated, { FadeIn, FadeInRight, FadeOut, FadeOutRight } from 'react-native-reanimated';

interface ProfilePinnedProps extends React.ComponentPropsWithoutRef<typeof View> {
  profileId: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const ProfilePinned = ({ profileId, containerStyle }: ProfilePinnedProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { user } = useAuth();
  const { colors, mode } = useTheme();

  const { data: pinnedItems } = useQuery(userPinnedOptions({ userId: profileId }));
  const [items, setItems] = useState(pinnedItems ?? []);
  const [prevPinnedItems, setPrevPinnedItems] = useState(pinnedItems);
  if (pinnedItems !== prevPinnedItems) {
    setPrevPinnedItems(pinnedItems);
    setItems(pinnedItems ?? []);
  }
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = user?.id === profileId;
  const isDragDisabled = !isOwner || !isEditing || items.length <= 1;
  const { mutateAsync: reorderPinned } = useUserPinnedReorderMutation();
  const { mutateAsync: deletePinned } = useUserPinnedDeleteMutation();

  const handleRemove = useCallback(
    async (idToRemove: number) => {
      Alert.alert(
        t('common.messages.are_u_sure'),
        undefined,
        [
          {
            text: t('common.messages.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.messages.delete'),
            onPress: async () => {
              const previousItems = items;
              setItems((current) => current.filter((i) => i.id !== idToRemove));

              await deletePinned(
                {
                  body: { itemIds: [idToRemove] },
                },
                {
                  onSuccess: () =>
                    toast.success(t('common.messages.unpinned', { gender: 'male', count: 1 })),
                  onError: () => {
                    setItems(previousItems);
                    toast.error(t('common.messages.an_error_occurred'));
                  },
                },
              );
            },
            style: 'destructive',
          },
        ],
        {
          userInterfaceStyle: mode,
        },
      );
    },
    [items, deletePinned, toast, t, mode],
  );

  const handleDragEnd = useCallback(
    async ({
      from,
      to,
      data,
    }: DragEndParams<
      NonNullable<
        Awaited<ReturnType<NonNullable<ReturnType<typeof userPinnedOptions>['queryFn']>>>
      >[number]
    >) => {
      if (from === to) return;
      const updatedItem = data.at(to);
      const previousItems = items;

      if (updatedItem) {
        setItems(data);
        await reorderPinned(
          {
            path: {
              pinned_item_id: Number(updatedItem.id),
            },
            body: {
              position: to + 1,
            },
          },
          {
            onError: () => {
              setItems(previousItems);
              toast.error(t('common.messages.an_error_occurred'));
            },
          },
        );
      }
    },
    [items, reorderPinned, toast, t],
  );

  const renderItem = useCallback(
    ({
      item,
      drag,
      isActive,
    }: RenderItemParams<
      NonNullable<
        Awaited<ReturnType<NonNullable<ReturnType<typeof userPinnedOptions>['queryFn']>>>
      >[number]
    >) => {
      console.log(
        'isDragDisabled',
        isDragDisabled,
        'isActive',
        isActive,
        'isEditing',
        isEditing,
        'item.type',
        item.type,
        'item.data',
        item.data,
      );
      const title =
        (item.type === 'movie'
          ? item.data.title
          : item.type === 'tv_series'
            ? item.data.name
            : item.type === 'person'
              ? item.data.name
              : item.type === 'playlist'
                ? item.data
                  ? item.data.title
                  : t('common.messages.not_found')
                : null) || '';
      const image =
        (item.type === 'movie'
          ? getTmdbImage({ path: item.data.posterPath, size: 'w342' })
          : item.type === 'tv_series'
            ? getTmdbImage({ path: item.data.posterPath, size: 'w342' })
            : item.type === 'person'
              ? getTmdbImage({ path: item.data.profilePath, size: 'w342' })
              : item.type === 'playlist'
                ? item.data?.poster
                : null) || '';
      const href: Href =
        item.type === 'movie'
          ? { pathname: '/film/[film_id]', params: { film_id: item.data.slug || item.data.id } }
          : item.type === 'tv_series'
            ? {
                pathname: '/tv-series/[tv_series_id]',
                params: { tv_series_id: item.data.slug || item.data.id },
              }
            : item.type === 'person'
              ? {
                  pathname: '/person/[person_id]',
                  params: { person_id: item.data.slug || item.data.id },
                }
              : item.type === 'playlist' && item.data
                ? { pathname: '/playlist/[playlist_id]', params: { playlist_id: item.data.id } }
                : { pathname: '/', params: {} };
      return (
        <ScaleDecorator activeScale={0.95}>
          <View style={tw`w-18 mr-4`}>
            <Link
              href={href}
              onPress={(event) => {
                // `Pressable.disabled` would also swallow `onLongPress` (the drag trigger below),
                // so navigation is cancelled here instead, on the Link's own press, while editing.
                if (isEditing) {
                  event.preventDefault();
                  return;
                }
                withHaptic(() => undefined)();
              }}
              asChild
            >
              <Pressable
                onLongPress={isDragDisabled ? undefined : drag}
                disabled={isActive || (item.type === 'playlist' && item.data === null)}
                style={{ opacity: item.status !== 'available' ? 0.5 : 1 }}
              >
                <View
                  style={{
                    ...tw`overflow-hidden aspect-square rounded-full w-auto h-auto border border-2`,
                    ...{ borderColor: colors.muted },
                  }}
                >
                  <Link.AppleZoom>
                    <ImageWithFallback
                      source={{ uri: image }}
                      alt={title}
                      type={item.type}
                      style={tw`aspect-square rounded-full w-auto h-auto`}
                    />
                  </Link.AppleZoom>
                </View>
                <Text numberOfLines={1} style={tw`text-center text-sm`}>
                  {title}
                </Text>
              </Pressable>
            </Link>
            {isEditing && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={tw`absolute top-0 right-0`}>
                <Button
                  variant="outline"
                  size="fit"
                  icon={Icons.X}
                  onPress={() => handleRemove(Number(item.id))}
                  style={tw`rounded-full p-1`}
                />
              </Animated.View>
            )}
          </View>
        </ScaleDecorator>
      );
    },
    [isDragDisabled, isEditing, colors.muted, handleRemove, t],
  );

  if (!items?.length) return null;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={tw`relative`}>
      {isOwner && (
        <Animated.View
          entering={FadeInRight}
          exiting={FadeOutRight}
          style={[tw`absolute -top-2 right-2 z-20`]}
        >
          <Button
            variant="outline"
            size="fit"
            icon={isEditing ? Icons.Check : Icons.Edit}
            onPress={() => setIsEditing((current) => !current)}
            style={tw`rounded-full p-2`}
          />
        </Animated.View>
      )}
      <DraggableFlatList
        data={items}
        onDragEnd={handleDragEnd}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[tw`px-4`, containerStyle]}
      />
    </Animated.View>
  );
};

export default ProfilePinned;

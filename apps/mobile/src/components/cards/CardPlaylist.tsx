import { ImageWithFallback } from '../utils/ImageWithFallback';
import React from 'react';
import Animated from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import tw from '../../lib/tw';
import { useTheme } from '../../providers/ThemeProvider';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import BottomSheetPlaylist from '../bottom-sheets/sheets/BottomSheetPlaylist';
import { useTranslations } from 'use-intl';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/text';
import { Playlist, UserSummary } from '@libs/api-js';
import { FixedOmit } from '../../utils/fixed-omit';

interface CardPlaylistBaseProps extends React.ComponentPropsWithRef<typeof Animated.View> {
  variant?: 'default' | 'list';
  linked?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  showItemsCount?: boolean;
}

type CardPlaylistSkeletonProps = {
  skeleton: true;
  playlist?: never;
  owner?: never;
};

type CardPlaylistDataProps = {
  skeleton?: false;
  playlist: Playlist;
  owner?: UserSummary;
};

export type CardPlaylistProps = CardPlaylistBaseProps &
  (CardPlaylistSkeletonProps | CardPlaylistDataProps);

const CardPlaylistDefault = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<CardPlaylistProps, 'variant' | 'linked' | 'onPress' | 'onLongPress'> & {
    // Only true when this card is actually rendered inside a <Link> (see CardPlaylist below) —
    // Link.AppleZoom throws if used outside one.
    enableZoomTransition?: boolean;
  }
>(
  (
    {
      style,
      playlist,
      owner,
      skeleton,
      showItemsCount = false,
      children,
      enableZoomTransition,
      ...props
    },
    ref,
  ) => {
    const t = useTranslations();
    const { colors } = useTheme();
    const poster = (
      <ImageWithFallback
        source={{ uri: playlist?.poster ?? '' }}
        alt={playlist?.title ?? ''}
        type="playlist"
        style={tw`aspect-square w-auto h-auto`}
      />
    );
    return (
      <Animated.View ref={ref} style={[tw`gap-2`, style]} {...props}>
        {!skeleton ? (
          enableZoomTransition ? (
            <Link.AppleZoom>{poster}</Link.AppleZoom>
          ) : (
            poster
          )
        ) : (
          <Skeleton style={tw`aspect-square w-auto h-auto`} />
        )}
        <View style={skeleton ? tw`gap-1` : undefined}>
          {!skeleton ? (
            <Text numberOfLines={2} style={tw`font-medium`}>
              {playlist.title}
            </Text>
          ) : (
            <Skeleton style={tw`w-24 h-5`} />
          )}
          {owner &&
            (!skeleton ? (
              <Text
                style={{ color: colors.mutedForeground }}
                numberOfLines={1}
                className="text-sm italic"
              >
                {t('common.messages.by_name', { name: owner.username })}
              </Text>
            ) : (
              <Skeleton style={tw`w-24 h-5`} />
            ))}
          {showItemsCount &&
            (!skeleton ? (
              <Text
                style={{ color: colors.mutedForeground }}
                numberOfLines={1}
                className="text-sm italic"
              >
                {t('common.messages.item_count', { count: playlist.itemsCount })}
              </Text>
            ) : (
              <Skeleton style={tw`w-10 h-5`} />
            ))}
        </View>
      </Animated.View>
    );
  },
);
CardPlaylistDefault.displayName = 'CardPlaylistDefault';

const CardPlaylistList = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<CardPlaylistProps, 'variant' | 'linked' | 'onPress' | 'onLongPress'> & {
    // Only true when this card is actually rendered inside a <Link> (see CardPlaylist below) —
    // Link.AppleZoom throws if used outside one.
    enableZoomTransition?: boolean;
  }
>(
  (
    { style, playlist, owner, skeleton, showItemsCount, children, enableZoomTransition, ...props },
    ref,
  ) => {
    const { colors } = useTheme();
    const t = useTranslations();
    const poster = (
      <ImageWithFallback
        source={{ uri: playlist?.poster ?? '' }}
        alt={playlist?.title ?? ''}
        type="playlist"
        style={tw`aspect-square w-auto`}
      />
    );
    return (
      <Animated.View
        ref={ref}
        style={[tw`flex-row justify-between items-center p-1 h-20 gap-2`, style]}
        {...props}
      >
        <View style={tw`flex-1 flex-row items-center gap-2`}>
          {!skeleton ? (
            enableZoomTransition ? (
              <Link.AppleZoom>{poster}</Link.AppleZoom>
            ) : (
              poster
            )
          ) : (
            <Skeleton style={tw`aspect-square w-auto h-auto`} />
          )}
          <View style={skeleton ? tw`gap-1` : undefined}>
            {!skeleton ? (
              <Text numberOfLines={2} style={tw`font-medium`}>
                {playlist.title}
              </Text>
            ) : (
              <Skeleton style={tw`w-24 h-5`} />
            )}
            {owner &&
              (!skeleton ? (
                <Text
                  style={{ color: colors.mutedForeground }}
                  numberOfLines={1}
                  className="text-sm italic"
                >
                  {t('common.messages.by_name', { name: owner.username })}
                </Text>
              ) : (
                <Skeleton style={tw`w-24 h-5`} />
              ))}
            {showItemsCount &&
              (!skeleton ? (
                <Text
                  style={{ color: colors.mutedForeground }}
                  numberOfLines={1}
                  className="text-sm italic"
                >
                  {t('common.messages.item_count', { count: playlist.itemsCount })}
                </Text>
              ) : (
                <Skeleton style={tw`w-10 h-5`} />
              ))}
          </View>
        </View>
      </Animated.View>
    );
  },
);
CardPlaylistList.displayName = 'CardPlaylistList';

const CardPlaylist = React.forwardRef<React.ComponentRef<typeof Animated.View>, CardPlaylistProps>(
  ({ variant = 'default', linked = true, onPress, onLongPress, ...props }, ref) => {
    const openSheet = useBottomSheetStore((state) => state.openSheet);

    const content =
      variant === 'default' ? (
        <CardPlaylistDefault ref={ref} {...props} enableZoomTransition={linked} />
      ) : variant === 'list' ? (
        <CardPlaylistList ref={ref} {...props} enableZoomTransition={linked} />
      ) : null;

    if (props.skeleton) return content;

    const handleLongPress = () => {
      openSheet(BottomSheetPlaylist, {
        playlist: props.playlist,
        owner: props.owner,
      });
      onLongPress?.();
    };

    if (!linked) {
      return (
        <Pressable onPress={onPress} onLongPress={handleLongPress}>
          {content}
        </Pressable>
      );
    }

    return (
      <Link
        href={{ pathname: '/playlist/[playlist_id]', params: { playlist_id: props.playlist.id } }}
        asChild
      >
        <Pressable onPress={onPress} onLongPress={handleLongPress}>
          {content}
        </Pressable>
      </Link>
    );
  },
);
CardPlaylist.displayName = 'CardPlaylist';

export { CardPlaylist, CardPlaylistDefault };

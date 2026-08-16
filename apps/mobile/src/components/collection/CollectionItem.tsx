import Animated from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import tw from '../../lib/tw';
import { Icons } from '../../constants/Icons';
import { View } from '../ui/view';
import { Text } from '../ui/text';
import { Link, LinkProps } from 'expo-router';
import { ImageWithFallback } from '../utils/ImageWithFallback';
import { Button } from '../ui/Button';
import { CollectionAction } from './CollectionScreen';
import { forwardRef, useCallback } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { ViewType } from '@libs/api-js';

interface CollectionItemProps<T> extends React.ComponentProps<typeof Animated.View> {
  item: T;
  swipeActions?: CollectionAction<T>[];
  bottomSheetActions?: CollectionAction<T>[];
  getItemId: (item: T) => string | number;
  getItemTitle: (item: T) => string;
  getItemSubtitle?: (item: T) => string;
  getItemImageUrl?: (item: T) => string;
  getItemUrl?: (item: T) => string;
  onItemAction?: (item: T) => void;
  view?: ViewType;
  type?: 'movie' | 'tv_series';
  index: number;
}

const CollectionItem = forwardRef<
  React.ComponentRef<typeof Animated.View>,
  CollectionItemProps<any>
>(
  (
    {
      style,
      item,
      swipeActions,
      bottomSheetActions,
      getItemId,
      getItemTitle,
      getItemSubtitle,
      getItemImageUrl,
      getItemUrl,
      onItemAction,
      view = 'list',
      type,
      index,
      ...props
    },
    ref,
  ) => {
    const { colors } = useTheme();

    const title = getItemTitle?.(item);
    const subtitle = getItemSubtitle?.(item);
    const image = getItemImageUrl?.(item);
    const url = getItemUrl?.(item);

    // Handlers
    const handleLongPress = useCallback(() => {
      onItemAction?.(item);
    }, [item, onItemAction]);

    // Only the poster image itself is the zoom source — never the row's title/subtitle text.
    const posterImage = (
      <ImageWithFallback
        alt={title}
        source={{ uri: image }}
        type={type}
        // Slot (used by Link.AppleZoom below) throws if its single child's style is an array —
        // must be a flattened object instead.
        style={
          view === 'grid'
            ? undefined
            : ({
                aspectRatio: 2 / 3,
                height: 'fit-content',
                ...tw`rounded-md w-16`,
              } as unknown as ViewStyle)
        }
      />
    );
    // Link.AppleZoom throws when used outside a <Link>, so it's only rendered in the `url`
    // branch below (the only place this poster is ever wrapped in one).
    const zoomablePosterImage = url ? <Link.AppleZoom>{posterImage}</Link.AppleZoom> : posterImage;

    const pressableContent =
      view === 'grid' ? (
        <Animated.View style={tw`relative flex items-center w-full aspect-2/3`}>
          {zoomablePosterImage}
        </Animated.View>
      ) : (
        <View style={tw`flex-row items-center gap-2`}>
          {zoomablePosterImage}
          <View style={tw`shrink`}>
            <Text numberOfLines={1}>{title}</Text>
            {subtitle && (
              <Text numberOfLines={1} style={{ color: colors.mutedForeground }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      );

    // const RightActions = useCallback((prog: SharedValue<number>, drag: SharedValue<number>, item: any, swipeable: SwipeableMethods) => {
    //     if (!swipeActions?.length) return null;

    //     const styleAnimation = useAnimatedStyle(() => {
    //         return {
    //             transform: [{ translateX: drag.value + 50 * swipeActions.length }],
    //         };
    //     });

    //     return (
    //         <Animated.View style={[tw`rounded-r-md overflow-hidden flex-row`, styleAnimation]}>
    //             {swipeActions.map((action, index) => (
    //                 <Button
    //                     key={index}
    //                     variant={action.variant || "default"}
    //                     icon={action.icon}
    //                     style={[
    //                         tw`h-full rounded-none`,
    //                         { width: 50 },
    //                     ]}
    //                     size="icon"
    //                     onPress={() => {
    // 						swipeable.close();
    // 						handleActionWithConfirmation(action, item)
    // 					}}
    //                 />
    //             ))}
    //         </Animated.View>
    //     );
    // }, [swipeActions, handleActionWithConfirmation]);

    return (
      <Animated.View
        ref={ref}
        // entering={FadeInDown}
        style={[tw`flex-row items-center justify-between gap-2`, style]}
        {...props}
      >
        {url ? (
          <Link href={url as LinkProps['href']} asChild>
            <Pressable style={tw`flex-1`} onLongPress={handleLongPress}>
              {pressableContent}
            </Pressable>
          </Link>
        ) : (
          <Pressable style={tw`flex-1`} onLongPress={handleLongPress}>
            {pressableContent}
          </Pressable>
        )}

        {view === 'list' && (
          <Button
            variant="ghost"
            size="icon"
            icon={Icons.EllipsisHorizontal}
            iconProps={{ color: colors.mutedForeground }}
            onPress={() => onItemAction?.(item)}
          />
        )}
      </Animated.View>
    );
  },
);
CollectionItem.displayName = 'CollectionItem';

export { CollectionItem };

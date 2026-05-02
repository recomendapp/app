import Animated from 'react-native-reanimated';
import { ImageWithFallback } from '../utils/ImageWithFallback';
import { Href, useRouter } from 'expo-router';
import tw from '../../lib/tw';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/text';
import BottomSheetPerson from '../bottom-sheets/sheets/BottomSheetPerson';
import { GAP } from '../../theme/globals';
import UserAvatar, { UserAvatarProps } from '../user/UserAvatar';
import { PersonCompact } from '@libs/api-js';
import { FixedOmit } from '../../utils/fixed-omit';
import { getTmdbImage } from '../../lib/tmdb/getTmdbImage';
import { forwardRef } from 'react';

interface CardPersonBaseProps extends React.ComponentPropsWithRef<typeof Animated.View> {
  variant?: 'default' | 'poster' | 'list' | 'vertical' | 'inline';
  linked?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}

type CardPersonSkeletonProps = {
  skeleton: true;
  person?: never;
};

type CardPersonDataProps = {
  skeleton?: false;
  person: PersonCompact;
};

type VariantBaseProps = Omit<CardPersonBaseProps, 'variant'> &
  (CardPersonSkeletonProps | CardPersonDataProps);

type VariantMap = {
  default: VariantBaseProps & {
    variant?: 'default';
  };
  poster: VariantBaseProps & {
    variant: 'poster';
  };
  list: VariantBaseProps & {
    variant: 'list';
  };
  vertical: VariantBaseProps & {
    variant: 'vertical';
  };
  inline: VariantBaseProps & {
    variant: 'inline';
    avatarStyle?: UserAvatarProps['style'];
  };
};

export type CardPersonProps = VariantMap[keyof VariantMap];

const CardPersonDefault = forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<CardPersonProps, 'variant' | 'linked' | 'onPress' | 'onLongPress'>
>(({ style, person, skeleton, children, ...props }, ref) => {
  const { colors } = useTheme();
  return (
    <Animated.View
      ref={ref}
      style={[
        { backgroundColor: colors.card, borderColor: colors.border },
        tw`flex-row justify-between items-center rounded-xl h-20 p-1 gap-2 border overflow-hidden`,
        style,
      ]}
      {...props}
    >
      <View style={tw`flex-1 flex-row items-center gap-2`}>
        {!skeleton ? (
          <ImageWithFallback
            source={{ uri: getTmdbImage({ path: person.profilePath, size: 'w342' }) }}
            alt={person.name ?? ''}
            type={'person'}
            style={{
              aspectRatio: 2 / 3,
              width: 'auto',
            }}
          />
        ) : (
          <Skeleton style={{ aspectRatio: 2 / 3, width: 'auto' }} />
        )}
        <View style={tw`shrink px-2 py-1 gap-1`}>
          {!skeleton ? (
            <Text numberOfLines={2}>{person.name}</Text>
          ) : (
            <Skeleton style={tw.style('w-full h-5')} />
          )}
          {children}
        </View>
      </View>
    </Animated.View>
  );
});
CardPersonDefault.displayName = 'CardPersonDefault';

const CardPersonPoster = forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<CardPersonProps, 'variant' | 'linked' | 'onPress' | 'onLongPress'>
>(({ style, person, skeleton, children, ...props }, ref) => {
  return (
    <Animated.View
      ref={ref}
      style={[
        { aspectRatio: 2 / 3 },
        tw.style(
          'relative flex gap-4 items-center w-32 shrink-0 rounded-sm border-transparent overflow-hidden',
        ),
        style,
      ]}
      {...props}
    >
      {!skeleton ? (
        <ImageWithFallback
          source={{ uri: getTmdbImage({ path: person.profilePath, size: 'w342' }) }}
          alt={person.name ?? ''}
          type={'person'}
        />
      ) : (
        <Skeleton style={tw.style('w-full h-full')} />
      )}
    </Animated.View>
  );
});
CardPersonPoster.displayName = 'CardPersonPoster';

const CardPersonInline = forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<VariantMap['inline'], 'variant' | 'linked' | 'onPress' | 'onLongPress'>
>(({ person, avatarStyle, children, skeleton, style, ...props }, ref) => {
  return (
    <Animated.View ref={ref} style={[tw.style('flex-row items-center gap-1'), style]}>
      {!skeleton ? (
        <UserAvatar
          full_name={person.name!}
          avatar_url={getTmdbImage({ path: person.profilePath, size: 'w342' })}
          style={avatarStyle}
        />
      ) : (
        <UserAvatar skeleton />
      )}
      {!skeleton ? <Text>{person.name}</Text> : <Skeleton style={tw.style('w-12 h-4')} />}
    </Animated.View>
  );
});
CardPersonInline.displayName = 'CardPersonInline';

const CardPersonList = forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<VariantMap['list'], 'variant' | 'linked' | 'onPress' | 'onLongPress'>
>(({ style, person, skeleton, children, ...props }, ref) => {
  return (
    <Animated.View
      ref={ref}
      style={[{ gap: GAP }, tw`flex-row justify-between items-center p-1 h-20`, style]}
      {...props}
    >
      <View style={tw`flex-1 flex-row items-center gap-2`}>
        {!skeleton ? (
          <ImageWithFallback
            source={{ uri: getTmdbImage({ path: person.profilePath, size: 'w342' }) }}
            alt={person.name ?? ''}
            type={'person'}
            style={[
              {
                aspectRatio: 2 / 3,
                width: 'auto',
              },
            ]}
          />
        ) : (
          <Skeleton style={{ aspectRatio: 2 / 3, width: 'auto' }} />
        )}
        <View style={tw`shrink px-2 py-1 gap-1`}>
          {!skeleton ? (
            <Text numberOfLines={2}>{person.name}</Text>
          ) : (
            <Skeleton style={tw.style('w-full h-5')} />
          )}
          {children}
        </View>
      </View>
    </Animated.View>
  );
});
CardPersonList.displayName = 'CardPersonList';

const CardPersonVertical = forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<CardPersonProps, 'variant' | 'linked' | 'onPress' | 'onLongPress'>
>(({ style, person, skeleton, children, ...props }, ref) => {
  return (
    <Animated.View ref={ref} style={[tw`items-center p-1 gap-2 overflow-hidden`, style]} {...props}>
      {!skeleton ? (
        <ImageWithFallback
          source={{ uri: getTmdbImage({ path: person.profilePath, size: 'w342' }) }}
          alt={person.name ?? ''}
          type={'person'}
          style={{
            aspectRatio: 2 / 3,
            width: '100%',
          }}
        />
      ) : (
        <Skeleton style={{ aspectRatio: 2 / 3, width: '100%' }} />
      )}
      <View style={tw`px-2 py-1 gap-1`}>
        {!skeleton ? (
          <Text numberOfLines={2} style={tw`text-center`}>
            {person.name}
          </Text>
        ) : (
          <Skeleton style={tw.style('w-full h-5')} />
        )}
        {children}
      </View>
    </Animated.View>
  );
});
CardPersonVertical.displayName = 'CardPersonVertical';

const CardPerson = forwardRef<React.ComponentRef<typeof Animated.View>, CardPersonProps>(
  ({ variant = 'default', linked = true, onPress, onLongPress, ...props }, ref) => {
    const router = useRouter();
    const openSheet = useBottomSheetStore((state) => state.openSheet);

    const content =
      variant === 'default' ? (
        <CardPersonDefault ref={ref} {...props} />
      ) : variant === 'poster' ? (
        <CardPersonPoster ref={ref} {...props} />
      ) : variant === 'list' ? (
        <CardPersonList ref={ref} {...props} />
      ) : variant === 'vertical' ? (
        <CardPersonVertical ref={ref} {...props} />
      ) : variant === 'inline' ? (
        <CardPersonInline ref={ref} {...props} />
      ) : null;

    if (props.skeleton) return content;

    return (
      <Pressable
        onPress={() => {
          if (linked) router.push(props.person.url as Href);
          onPress?.();
        }}
        onLongPress={() => {
          openSheet(BottomSheetPerson, {
            person: props.person,
          });
          onLongPress?.();
        }}
      >
        {content}
      </Pressable>
    );
  },
);
CardPerson.displayName = 'CardPerson';

export { CardPerson, CardPersonDefault, CardPersonPoster };

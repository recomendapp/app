import { Button } from 'apps/mobile/src/components/ui/Button';
import { useAuth } from 'apps/mobile/src/providers/AuthProvider';
import upperFirst from 'lodash/upperFirst';
import { Alert, ViewStyle } from 'react-native';
import tw from "apps/mobile/src/lib/tw";
import { useTranslations } from "use-intl";
import { useToast } from "../Toast";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { forwardRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userPersonFollowOptions, useUserPersonFollowMutation, useUserPersonUnfollowMutation } from '@libs/query-client';

type ButtonPersonFollowSkeletonProps = {
  skeleton: true;
  personId?: never;
}

type ButtonPersonFollowDataProps = {
  skeleton?: false;
  personId: number;
}

export type ButtonPersonFollowProps = React.ComponentProps<typeof Button> &
  (ButtonPersonFollowSkeletonProps | ButtonPersonFollowDataProps);

const ButtonPersonFollow = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonPersonFollowProps
>(({ personId, onPress, skeleton, style, ...props }, ref) => {
  const toast = useToast();
  const t = useTranslations();
  const { user } = useAuth();
  const { mode } = useTheme();

  const {
    data: isFollow,
    isLoading,
  } = useQuery(userPersonFollowOptions({
    userId: user?.id,
    personId: personId,
  }));
  const loading = skeleton || !personId || isLoading || isFollow === undefined;

  const { mutateAsync: insertFollow } = useUserPersonFollowMutation({
    userId: user?.id,
  });
  const { mutateAsync: deleteFollower } = useUserPersonUnfollowMutation({
    userId: user?.id,
  });

  const followPerson = useCallback(async () => {
    if (!personId) return;
    await insertFollow({
      path: {
        person_id: personId,
      }
    }, {
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [insertFollow, personId, toast, t]);

  const unfollowPerson = useCallback(async () => {
    if (!personId) return;
    Alert.alert(
      upperFirst(t('common.messages.are_u_sure')),
      undefined,
      [
        {
          text: upperFirst(t('common.messages.cancel')),
          style: 'cancel',
        },
        {
          text: upperFirst(t('common.messages.unfollow')),
          onPress: async () => {
            await deleteFollower({
              path: {
                person_id: personId,
              }
            }, {
              onError: (error) => {
                toast.error(upperFirst(t('common.messages.an_error_occurred')));
              }
            });
          },
          style: 'destructive',
        }
      ], {
        userInterfaceStyle: mode,
      }
    );
  }, [deleteFollower, personId, toast, t, mode]);

  if (!user || loading) return null;

  return (
    <Button
    ref={ref}
    onPress={async (e) => {
      if (isFollow) {
        await unfollowPerson()
      } else {
        await followPerson()
      }
      onPress?.(e);
    }}
    variant={isFollow ? "muted" : "accent-yellow"}
    style={[
      tw.style('px-4 py-2 h-auto rounded-full'),
      style as ViewStyle,
    ]}
    {...props}
    >
      {isFollow ? (
        upperFirst(t('common.messages.followed'))
      ) : upperFirst(t('common.messages.follow'))}
    </Button>
  );
});
ButtonPersonFollow.displayName = "ButtonPersonFollow";

export default ButtonPersonFollow;

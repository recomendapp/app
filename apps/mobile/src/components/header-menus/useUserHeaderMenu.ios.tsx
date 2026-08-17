import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import type { NativeStackHeaderItem } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { useQuery } from '@tanstack/react-query';
import {
  userFollowOptions,
  useUserFollowMutation,
  useUserUnfollowMutation,
} from '@libs/query-client';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { useToast } from '../Toast';
import BottomSheetShareUser from '../bottom-sheets/sheets/share/BottomSheetShareUser';
import { UseUserHeaderMenuParams } from './useUserHeaderMenu';
import { HeaderMenuReturn } from '.';

/**
 * Native iOS header menu variant, replacing BottomSheetUser for this header entry point.
 * Builds its own menu directly (no shared generic menu-builder) — each header menu owns its
 * own layout since they don't share enough structure to be worth abstracting yet.
 *
 * Sectioned (each `inline` submenu becomes a divider-separated group):
 *   - top row: Share only, `layout: 'palette'` (Apple Music-style icon row)
 *   - middle: go to user
 *   - bottom: Follow/Unfollow (only when logged in and viewing someone else) — kept out of the
 *     palette row since `layout: 'palette'` never shows labels, and this action needs its text
 *     to convey follow / pending / followed state clearly.
 */
export const useUserHeaderMenu = ({ profile }: UseUserHeaderMenuParams): HeaderMenuReturn => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { mode } = useTheme();
  const toast = useToast();
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const canFollow = !!user && !!profile && user.id !== profile.id;

  const { data: isFollow } = useQuery(
    userFollowOptions({ userId: user?.id, profileId: profile?.id }),
  );
  const { mutateAsync: insertFollow } = useUserFollowMutation();
  const { mutateAsync: deleteFollow } = useUserUnfollowMutation();

  const onMenuPress = useCallback(() => {}, []);

  const onFollowError = useCallback(
    () => toast.error(upperFirst(t('common.messages.an_error_occurred'))),
    [toast, t],
  );

  const handleFollowToggle = useCallback(() => {
    if (!profile) return;
    if (isFollow) {
      Alert.alert(
        upperFirst(t('common.messages.are_u_sure')),
        undefined,
        [
          { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
          {
            text:
              isFollow.status === 'pending'
                ? upperFirst(t('common.messages.cancel_request'))
                : upperFirst(t('common.messages.unfollow')),
            style: 'destructive',
            onPress: () => {
              deleteFollow({ path: { user_id: profile.id } }, { onError: onFollowError });
            },
          },
        ],
        { userInterfaceStyle: mode },
      );
    } else {
      insertFollow({ path: { user_id: profile.id } }, { onError: onFollowError });
    }
  }, [profile, isFollow, deleteFollow, insertFollow, onFollowError, t, mode]);

  const headerRightItems = useCallback((): NativeStackHeaderItem[] => {
    if (!profile) return [];
    return [
      {
        type: 'menu',
        label: upperFirst(t('common.messages.menu')),
        icon: { type: 'sfSymbol', name: 'ellipsis' },
        menu: {
          items: [
            {
              type: 'submenu',
              label: '',
              inline: true,
              items: [
                {
                  type: 'action' as const,
                  label: upperFirst(t('common.messages.share')),
                  icon: { type: 'sfSymbol' as const, name: 'square.and.arrow.up' as const },
                  onPress: () => openSheet(BottomSheetShareUser, { user: profile }),
                },
                ...(!pathname.startsWith(`/user/${profile.username}`)
                  ? [
                      {
                        type: 'action' as const,
                        label: upperFirst(t('common.messages.go_to_user')),
                        icon: { type: 'sfSymbol' as const, name: 'person' as const },
                        onPress: () =>
                          router.push({
                            pathname: '/user/[username]',
                            params: { username: profile.username },
                          }),
                      },
                    ]
                  : []),
              ],
            },
            ...(canFollow
              ? [
                  {
                    type: 'submenu' as const,
                    label: '',
                    inline: true,
                    items: [
                      {
                        type: 'action' as const,
                        label: isFollow
                          ? isFollow.status === 'pending'
                            ? upperFirst(t('common.messages.request_sent'))
                            : upperFirst(t('common.messages.unfollow'))
                          : upperFirst(t('common.messages.follow')),
                        icon: {
                          type: 'sfSymbol' as const,
                          name: (isFollow
                            ? isFollow.status === 'pending'
                              ? 'clock'
                              : 'person.badge.minus'
                            : 'person.badge.plus') as
                            | 'clock'
                            | 'person.badge.minus'
                            | 'person.badge.plus',
                        },
                        keepsMenuPresented: true,
                        onPress: handleFollowToggle,
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
      },
    ];
  }, [profile, canFollow, isFollow, handleFollowToggle, pathname, router, t, openSheet]);

  return { onMenuPress, headerRightItems };
};

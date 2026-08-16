import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import type { NativeStackHeaderItem } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { useQuery } from '@tanstack/react-query';
import {
  userPersonFollowOptions,
  useUserPersonFollowMutation,
  useUserPersonUnfollowMutation,
} from '@libs/query-client';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { useToast } from '../Toast';
import BottomSheetSharePerson from '../bottom-sheets/sheets/share/BottomSheetSharePerson';
import { UsePersonHeaderMenuParams } from './usePersonHeaderMenu';
import { HeaderMenuReturn } from '.';

/**
 * Native iOS header menu variant, replacing BottomSheetPerson for this header entry point.
 * Builds its own menu directly (no shared generic menu-builder) — each header menu owns its
 * own layout since they don't share enough structure to be worth abstracting yet.
 *
 * Sectioned (each `inline` submenu becomes a divider-separated group):
 *   - top row: Share only, `layout: 'palette'` (Apple Music-style icon row)
 *   - middle: go to person
 *   - bottom: Follow/Unfollow (only when logged in) — kept out of the palette row since
 *     `layout: 'palette'` never shows labels, and this action needs its text to convey
 *     follow / followed state clearly.
 */
export const usePersonHeaderMenu = ({ person }: UsePersonHeaderMenuParams): HeaderMenuReturn => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { mode } = useTheme();
  const toast = useToast();
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const { data: isFollowing } = useQuery(
    userPersonFollowOptions({ userId: user?.id, personId: person?.id }),
  );
  const { mutateAsync: insertFollow } = useUserPersonFollowMutation({ userId: user?.id });
  const { mutateAsync: deleteFollower } = useUserPersonUnfollowMutation({ userId: user?.id });

  const onMenuPress = useCallback(() => {}, []);

  const onFollowError = useCallback(
    () => toast.error(upperFirst(t('common.messages.an_error_occurred'))),
    [toast, t],
  );

  const handleFollowToggle = useCallback(() => {
    if (!person) return;
    if (isFollowing) {
      Alert.alert(
        upperFirst(t('common.messages.are_u_sure')),
        undefined,
        [
          { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
          {
            text: upperFirst(t('common.messages.unfollow')),
            style: 'destructive',
            onPress: () => {
              deleteFollower({ path: { person_id: person.id } }, { onError: onFollowError });
            },
          },
        ],
        { userInterfaceStyle: mode },
      );
    } else {
      insertFollow({ path: { person_id: person.id } }, { onError: onFollowError });
    }
  }, [person, isFollowing, deleteFollower, insertFollow, onFollowError, t, mode]);

  const headerRightItems = useCallback((): NativeStackHeaderItem[] => {
    if (!person) return [];
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
              layout: 'palette',
              items: [
                {
                  type: 'action' as const,
                  label: upperFirst(t('common.messages.share')),
                  icon: { type: 'sfSymbol' as const, name: 'square.and.arrow.up' as const },
                  onPress: () => openSheet(BottomSheetSharePerson, { person }),
                },
              ],
            },
            {
              type: 'submenu',
              label: '',
              inline: true,
              items: [
                ...(!pathname.startsWith(`/person/${person.id}`)
                  ? [
                      {
                        type: 'action' as const,
                        label: upperFirst(t('common.messages.go_to_person')),
                        icon: { type: 'sfSymbol' as const, name: 'person' as const },
                        onPress: () =>
                          router.push({
                            pathname: '/person/[person_id]',
                            params: { person_id: person.id },
                          }),
                      },
                    ]
                  : []),
              ],
            },
            ...(user
              ? [
                  {
                    type: 'submenu' as const,
                    label: '',
                    inline: true,
                    items: [
                      {
                        type: 'action' as const,
                        label: isFollowing
                          ? upperFirst(t('common.messages.followed'))
                          : upperFirst(t('common.messages.follow')),
                        icon: {
                          type: 'sfSymbol' as const,
                          name: (isFollowing ? 'person.badge.minus' : 'person.badge.plus') as
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
  }, [person, user, isFollowing, handleFollowToggle, pathname, router, t, openSheet]);

  return { onMenuPress, headerRightItems };
};

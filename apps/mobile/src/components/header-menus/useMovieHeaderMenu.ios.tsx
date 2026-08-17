import { useCallback } from 'react';
import { Href, useRouter, usePathname } from 'expo-router';
import type { NativeStackHeaderItem } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import { useAuth } from '../../providers/AuthProvider';
import BottomSheetShareMovie from '../bottom-sheets/sheets/share/BottomSheetShareMovie';
import { UseMovieHeaderMenuParams } from './useMovieHeaderMenu';
import { HeaderMenuReturn } from '.';

/**
 * Native iOS header menu variant, replacing BottomSheetMovie for this header entry point.
 * Builds its own menu directly (no shared generic menu-builder) — each header menu owns its
 * own layout since they don't share enough structure to be worth abstracting yet.
 *
 * Sectioned (each `inline` submenu becomes a divider-separated group):
 *   - top row: Share only, `layout: 'palette'` (Apple Music-style icon row)
 *   - middle: go to film, director(s)
 *   - bottom: add to playlist, send to friend (only when logged in)
 */
export const useMovieHeaderMenu = ({ movie }: UseMovieHeaderMenuParams): HeaderMenuReturn => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const onMenuPress = useCallback(() => {}, []);

  const headerRightItems = useCallback((): NativeStackHeaderItem[] => {
    if (!movie) return [];

    const middleItems = [
      {
        type: 'action' as const,
        label: upperFirst(t('common.messages.share')),
        icon: { type: 'sfSymbol' as const, name: 'square.and.arrow.up' as const },
        onPress: () => openSheet(BottomSheetShareMovie, { movie }),
      },
      ...(!pathname.startsWith(`/film/${movie.id}`)
        ? [
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.go_to_film')),
              icon: { type: 'sfSymbol' as const, name: 'film' as const },
              onPress: () =>
                router.push({ pathname: '/film/[film_id]', params: { film_id: movie.id } }),
            },
          ]
        : []),
      ...(movie.directors && movie.directors.length > 0
        ? [
            movie.directors.length > 1
              ? {
                  type: 'submenu' as const,
                  label: upperFirst(
                    t('common.messages.show_director', {
                      gender: 'male',
                      count: movie.directors.length,
                    }),
                  ),
                  icon: { type: 'sfSymbol' as const, name: 'person.2' as const },
                  items: movie.directors.map((director) => ({
                    type: 'action' as const,
                    label: director.name || '',
                    icon: { type: 'sfSymbol' as const, name: 'person' as const },
                    onPress: () => router.push(director.url as Href),
                  })),
                }
              : {
                  type: 'action' as const,
                  label: upperFirst(
                    t('common.messages.go_to_director', {
                      gender: movie.directors[0].gender === 1 ? 'female' : 'male',
                      count: 1,
                    }),
                  ),
                  icon: { type: 'sfSymbol' as const, name: 'person' as const },
                  onPress: () =>
                    router.push({
                      pathname: '/person/[person_id]',
                      params: { person_id: movie.directors![0].id },
                    }),
                },
          ]
        : []),
    ];

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
              items: middleItems,
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
                        label: upperFirst(t('common.messages.add_to_playlist')),
                        icon: { type: 'sfSymbol' as const, name: 'text.badge.plus' as const },
                        onPress: () =>
                          router.push({
                            pathname: '/playlist/add/[type]/[id]',
                            params: { type: 'movie', id: movie.id, title: movie.title },
                          }),
                      },
                      {
                        type: 'action' as const,
                        label: upperFirst(t('common.messages.send_to_friend')),
                        icon: { type: 'sfSymbol' as const, name: 'paperplane' as const },
                        onPress: () =>
                          router.push({
                            pathname: '/reco/send/[type]/[id]',
                            params: { type: 'movie', id: movie.id },
                          }),
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
      },
    ];
  }, [movie, pathname, router, t, user, openSheet]);

  return { onMenuPress, headerRightItems };
};

import { useCallback } from 'react';
import { Href, useRouter, usePathname } from 'expo-router';
import type { NativeStackHeaderItem } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import { useAuth } from '../../providers/AuthProvider';
import BottomSheetShareTvSeries from '../bottom-sheets/sheets/share/BottomSheetShareTvSeries';
import { UseTvSeriesHeaderMenuParams } from './useTvSeriesHeaderMenu';
import { HeaderMenuReturn } from '.';

/**
 * Native iOS header menu variant, replacing BottomSheetTvSeries for this header entry point.
 * Builds its own menu directly (no shared generic menu-builder) — each header menu owns its
 * own layout since they don't share enough structure to be worth abstracting yet.
 *
 * Sectioned (each `inline` submenu becomes a divider-separated group):
 *   - top row: Share only, `layout: 'palette'` (Apple Music-style icon row)
 *   - middle: go to tv series, creator(s)
 *   - bottom: add to playlist, send to friend (only when logged in)
 */
export const useTvSeriesHeaderMenu = ({
  tvSeries,
}: UseTvSeriesHeaderMenuParams): HeaderMenuReturn => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const onMenuPress = useCallback(() => {}, []);

  const headerRightItems = useCallback((): NativeStackHeaderItem[] => {
    if (!tvSeries) return [];

    const middleItems = [
      {
        type: 'action' as const,
        label: upperFirst(t('common.messages.share')),
        icon: { type: 'sfSymbol' as const, name: 'square.and.arrow.up' as const },
        onPress: () => openSheet(BottomSheetShareTvSeries, { tvSeries }),
      },
      ...(!pathname.startsWith(`/tv-series/${tvSeries.id}`)
        ? [
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.go_to_tv_series')),
              icon: { type: 'sfSymbol' as const, name: 'film' as const },
              onPress: () =>
                router.push({
                  pathname: '/tv-series/[tv_series_id]',
                  params: { tv_series_id: tvSeries.id },
                }),
            },
          ]
        : []),
      ...(tvSeries.createdBy && tvSeries.createdBy.length > 0
        ? [
            tvSeries.createdBy.length > 1
              ? {
                  type: 'submenu' as const,
                  label: upperFirst(
                    t('common.messages.show_creator', {
                      gender: 'male',
                      count: tvSeries.createdBy.length,
                    }),
                  ),
                  icon: { type: 'sfSymbol' as const, name: 'person.2' as const },
                  items: tvSeries.createdBy.map((creator) => ({
                    type: 'action' as const,
                    label: creator.name || '',
                    icon: { type: 'sfSymbol' as const, name: 'person' as const },
                    onPress: () => router.push(creator.url as Href),
                  })),
                }
              : {
                  type: 'action' as const,
                  label: upperFirst(
                    t('common.messages.go_to_creator', {
                      gender: tvSeries.createdBy[0].gender === 1 ? 'female' : 'male',
                      count: 1,
                    }),
                  ),
                  icon: { type: 'sfSymbol' as const, name: 'person' as const },
                  onPress: () =>
                    router.push({
                      pathname: '/person/[person_id]',
                      params: { person_id: tvSeries.createdBy![0].id },
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
                            params: {
                              type: 'tv_series',
                              id: tvSeries.id,
                              title: tvSeries.name,
                            },
                          }),
                      },
                      {
                        type: 'action' as const,
                        label: upperFirst(t('common.messages.send_to_friend')),
                        icon: { type: 'sfSymbol' as const, name: 'paperplane' as const },
                        onPress: () =>
                          router.push({
                            pathname: '/reco/send/[type]/[id]',
                            params: { type: 'tv_series', id: tvSeries.id },
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
  }, [tvSeries, pathname, router, t, user, openSheet]);

  return { onMenuPress, headerRightItems };
};

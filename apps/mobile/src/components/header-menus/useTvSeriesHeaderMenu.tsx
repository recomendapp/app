import { useCallback } from 'react';
import { TvSeriesCompact } from '@libs/api-js';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import BottomSheetTvSeries from '../bottom-sheets/sheets/BottomSheetTvSeries';
import { HeaderMenuReturn } from '.';

export interface UseTvSeriesHeaderMenuParams {
  tvSeries: TvSeriesCompact | undefined;
}

/**
 * Base (Android / non-iOS) variant — opens BottomSheetTvSeries, same as before native menus.
 * See .ios.tsx for the native header menu variant (unstable_headerRightItems is iOS-only).
 */
export const useTvSeriesHeaderMenu = ({
  tvSeries,
}: UseTvSeriesHeaderMenuParams): HeaderMenuReturn => {
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const onMenuPress = useCallback(() => {
    if (tvSeries) {
      openSheet(BottomSheetTvSeries, { tvSeries });
    }
  }, [tvSeries, openSheet]);

  return { onMenuPress, headerRightItems: undefined };
};

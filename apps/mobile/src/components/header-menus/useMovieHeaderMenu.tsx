import { useCallback } from 'react';
import { MovieCompact } from '@libs/api-js';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import BottomSheetMovie from '../bottom-sheets/sheets/BottomSheetMovie';
import { HeaderMenuReturn } from '.';

export interface UseMovieHeaderMenuParams {
  movie: MovieCompact | undefined;
}

/**
 * Base (Android / non-iOS) variant — opens BottomSheetMovie, same as before native menus.
 * See .ios.tsx for the native header menu variant (unstable_headerRightItems is iOS-only).
 */
export const useMovieHeaderMenu = ({ movie }: UseMovieHeaderMenuParams): HeaderMenuReturn => {
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const onMenuPress = useCallback(() => {
    if (movie) {
      openSheet(BottomSheetMovie, { movie });
    }
  }, [movie, openSheet]);

  return { onMenuPress, headerRightItems: undefined };
};

import { useCallback } from 'react';
import { PersonCompact } from '@libs/api-js';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import BottomSheetPerson from '../bottom-sheets/sheets/BottomSheetPerson';
import { HeaderMenuReturn } from '.';

export interface UsePersonHeaderMenuParams {
  person: PersonCompact | undefined;
}

/**
 * Base (Android / non-iOS) variant — opens BottomSheetPerson, same as before native menus.
 * See .ios.tsx for the native header menu variant (unstable_headerRightItems is iOS-only).
 */
export const usePersonHeaderMenu = ({ person }: UsePersonHeaderMenuParams): HeaderMenuReturn => {
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const onMenuPress = useCallback(() => {
    if (person) {
      openSheet(BottomSheetPerson, { person });
    }
  }, [person, openSheet]);

  return { onMenuPress, headerRightItems: undefined };
};

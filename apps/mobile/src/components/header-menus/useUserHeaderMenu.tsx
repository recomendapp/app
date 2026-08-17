import { useCallback } from 'react';
import { UserSummary } from '@libs/api-js';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import BottomSheetUser from '../bottom-sheets/sheets/BottomSheetUser';
import { HeaderMenuReturn } from '.';

export interface UseUserHeaderMenuParams {
  profile: UserSummary | undefined;
}

/**
 * Base (Android / non-iOS) variant — opens BottomSheetUser, same as before native menus.
 * See .ios.tsx for the native header menu variant (unstable_headerRightItems is iOS-only).
 */
export const useUserHeaderMenu = ({ profile }: UseUserHeaderMenuParams): HeaderMenuReturn => {
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const onMenuPress = useCallback(() => {
    if (profile) {
      openSheet(BottomSheetUser, { user: profile });
    }
  }, [profile, openSheet]);

  return { onMenuPress, headerRightItems: undefined };
};

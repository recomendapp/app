import { forwardRef, useRef } from 'react';
import { BottomSheetProps } from '../../BottomSheetManager';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ShareViewRef } from '../../../share/type';
import BottomSheetShareLayout from './BottomSheetShareLayout'; // Importer le layout
import { ShareUser } from '../../../share/ShareUser';
import { useAuth } from '../../../../providers/AuthProvider';
import { UserSummary } from '@libs/api-js';

interface BottomSheetShareUserProps extends BottomSheetProps {
  user: UserSummary;
}

const BottomSheetShareUser = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetShareUserProps
>(({ user, ...props }, ref) => {
  const { user: session } = useAuth();
  const shareViewRef = useRef<ShareViewRef>(null);
  return (
    <BottomSheetShareLayout
      ref={ref}
      path={`/@${user.username}`}
      contentRef={shareViewRef}
      {...props}
    >
      <ShareUser ref={shareViewRef} user={user} isPremium={!!session?.isPremium} />
    </BottomSheetShareLayout>
  );
});

BottomSheetShareUser.displayName = 'BottomSheetShareUser';

export default BottomSheetShareUser;

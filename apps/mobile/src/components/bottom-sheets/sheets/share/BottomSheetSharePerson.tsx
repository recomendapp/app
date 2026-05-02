import { forwardRef, useRef } from 'react';
import { BottomSheetProps } from '../../BottomSheetManager';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ShareViewRef } from '../../../share/type';
import BottomSheetShareLayout from './BottomSheetShareLayout'; // Importer le layout
import { useAuth } from '../../../../providers/AuthProvider';
import { SharePerson } from '../../../share/SharePerson';
import { PersonCompact } from '@libs/api-js';

interface BottomSheetSharePersonProps extends BottomSheetProps {
  person: PersonCompact;
}

const BottomSheetSharePerson = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetSharePersonProps
>(({ person, ...props }, ref) => {
  const { user } = useAuth();
  const shareViewRef = useRef<ShareViewRef>(null);
  return (
    <BottomSheetShareLayout
      ref={ref}
      path={person.url || `/person/${person.slug || person.id}`}
      contentRef={shareViewRef}
      {...props}
    >
      <SharePerson ref={shareViewRef} person={person} isPremium={!!user?.isPremium} />
    </BottomSheetShareLayout>
  );
});

BottomSheetSharePerson.displayName = 'BottomSheetSharePerson';

export default BottomSheetSharePerson;

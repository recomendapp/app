import { forwardRef, useRef } from 'react';
import { BottomSheetProps } from '../../BottomSheetManager';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ShareViewRef } from '../../../share/type';
import BottomSheetShareLayout from './BottomSheetShareLayout'; // Importer le layout
import { useAuth } from '../../../../providers/AuthProvider';
import { ShareTvSeries } from '../../../share/ShareTvSeries';
import { TvSeriesCompact } from '@libs/api-js';

interface BottomSheetShareTvSeriesProps extends BottomSheetProps {
  tvSeries: TvSeriesCompact;
}

const BottomSheetShareTvSeries = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetShareTvSeriesProps
>(({ tvSeries, ...props }, ref) => {
  const { user } = useAuth();
  const shareViewRef = useRef<ShareViewRef>(null);
  return (
    <BottomSheetShareLayout
      ref={ref}
      path={tvSeries.url || `/tv-series/${tvSeries.slug || tvSeries.id}`}
      contentRef={shareViewRef}
      {...props}
    >
      <ShareTvSeries ref={shareViewRef} tvSeries={tvSeries} isPremium={!!user?.isPremium} />
    </BottomSheetShareLayout>
  );
});

BottomSheetShareTvSeries.displayName = 'BottomSheetShareTvSeries';

export default BottomSheetShareTvSeries;

import { forwardRef, useRef } from 'react';
import { BottomSheetProps } from '../../BottomSheetManager';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ShareViewRef } from '../../../share/type';
import BottomSheetShareLayout from './BottomSheetShareLayout';
import { ShareReviewTvSeries } from '../../../share/ShareReviewTvSeries';
import { useAuth } from '../../../../providers/AuthProvider';
import { TvSeriesCompact, ReviewTvSeries, UserSummary } from '@libs/api-js';

interface BottomSheetShareReviewTvSeriesProps extends BottomSheetProps {
  tvSeries: TvSeriesCompact;
  review: ReviewTvSeries;
  author: UserSummary;
  rating?: number | null;
}

const BottomSheetShareReviewTvSeries = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetShareReviewTvSeriesProps
>(({ tvSeries, review, author, rating, ...props }, ref) => {
  const { user } = useAuth();
  const shareViewRef = useRef<ShareViewRef>(null);
  return (
    <BottomSheetShareLayout
      ref={ref}
      path={{
        pathname: '/user/[username]/tv-series/[tv_series_id]',
        params: { username: author.username, tv_series_id: tvSeries.slug || tvSeries.id },
      }}
      contentRef={shareViewRef}
      {...props}
    >
      <ShareReviewTvSeries
        ref={shareViewRef}
        tvSeries={tvSeries}
        review={review}
        author={author}
        rating={rating}
        isPremium={!!user?.isPremium}
      />
    </BottomSheetShareLayout>
  );
});

BottomSheetShareReviewTvSeries.displayName = 'BottomSheetShareReviewTvSeries';

export default BottomSheetShareReviewTvSeries;

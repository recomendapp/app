import { forwardRef, useRef } from 'react';
import { BottomSheetProps } from '../../BottomSheetManager';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ShareViewRef } from '../../../share/type';
import BottomSheetShareLayout from './BottomSheetShareLayout';
import { ShareReviewMovie } from '../../../share/ShareReviewMovie';
import { useAuth } from '../../../../providers/AuthProvider';
import { MovieCompact, ReviewMovie, UserSummary } from '@libs/api-js';

interface BottomSheetShareReviewMovieProps extends BottomSheetProps {
  movie: MovieCompact;
  review: ReviewMovie;
  author: UserSummary;
  rating?: number | null;
}

const BottomSheetShareReviewMovie = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetShareReviewMovieProps
>(({ movie, review, author, rating, ...props }, ref) => {
  const { user } = useAuth();
  const shareViewRef = useRef<ShareViewRef>(null);
  return (
    <BottomSheetShareLayout
      ref={ref}
      path={{
        pathname: '/user/[username]/film/[film_id]',
        params: { username: author.username, film_id: movie.slug || movie.id },
      }}
      contentRef={shareViewRef}
      {...props}
    >
      <ShareReviewMovie
        ref={shareViewRef}
        movie={movie}
        review={review}
        author={author}
        rating={rating}
        isPremium={!!user?.isPremium}
      />
    </BottomSheetShareLayout>
  );
});

BottomSheetShareReviewMovie.displayName = 'BottomSheetShareReviewMovie';

export default BottomSheetShareReviewMovie;

import { forwardRef, useRef } from 'react';
import { BottomSheetProps } from '../../BottomSheetManager';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ShareViewRef } from '../../../share/type';
import BottomSheetShareLayout from './BottomSheetShareLayout'; // Importer le layout
import { ShareMovie } from '../../../share/ShareMovie';
import { useAuth } from '../../../../providers/AuthProvider';
import { MovieCompact } from '@libs/api-js';

interface BottomSheetShareMovieProps extends BottomSheetProps {
  movie: MovieCompact;
}

const BottomSheetShareMovie = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetShareMovieProps
>(({ movie, ...props }, ref) => {
  const { user } = useAuth();
  const shareViewRef = useRef<ShareViewRef>(null);
  return (
    <BottomSheetShareLayout
      ref={ref}
      path={movie.url || `/film/${movie.slug || movie.id}`}
      contentRef={shareViewRef}
      {...props}
    >
      <ShareMovie ref={shareViewRef} movie={movie} isPremium={!!user?.isPremium} />
    </BottomSheetShareLayout>
  );
});

BottomSheetShareMovie.displayName = 'BottomSheetShareMovie';

export default BottomSheetShareMovie;

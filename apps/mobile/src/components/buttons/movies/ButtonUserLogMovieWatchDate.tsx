import { useAuth } from '../../../providers/AuthProvider';
import { Icons } from '../../../constants/Icons';
import { Button } from '../../ui/Button';
import tw from '../../../lib/tw';
import { forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movieLogOptions } from '@libs/query-client';
import { MovieCompact } from '@libs/api-js';
import { useRouter } from 'expo-router';

interface ButtonUserLogMovieWatchDateProps extends React.ComponentProps<typeof Button> {
  movie: MovieCompact;
}

const ButtonUserLogMovieWatchDate = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserLogMovieWatchDateProps
>(({ movie, variant = 'outline', size = 'icon', style, onPress: onPressProps, ...props }, ref) => {
  const { user } = useAuth();
  const router = useRouter();
  // Requests
  const { data: log } = useQuery(
    movieLogOptions({
      userId: user?.id,
      movieId: movie.id,
    }),
  );

  if (!log) return null;

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      icon={Icons.Calendar}
      onPress={(e) => {
        router.push({
          pathname: '/film/[film_id]/watched-dates',
          params: {
            film_id: movie.id,
          },
        });
        onPressProps?.(e);
      }}
      style={{
        ...tw`rounded-full`,
        ...style,
      }}
      {...props}
    />
  );
});
ButtonUserLogMovieWatchDate.displayName = 'ButtonUserLogMovieWatchDate';

export default ButtonUserLogMovieWatchDate;

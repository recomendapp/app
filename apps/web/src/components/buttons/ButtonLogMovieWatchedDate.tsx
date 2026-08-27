import * as React from 'react';
import { Button } from '@libs/ui/components/button';
import { useAuth } from '@/context/auth-context';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { cn } from '@/lib/utils';
import { CalendarDaysIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { movieLogOptions } from '@libs/query-client';
import { Link } from '@/lib/i18n/navigation';
import { getLogMovieWatchedDatesHref } from '@/utils/hrefs/get-log-movie-watched-dates-href';

interface ButtonLogMovieWatchedDateProps extends React.ComponentProps<typeof Button> {
  movieId: number;
  stopPropagation?: boolean;
}

const ButtonLogMovieWatchedDate = React.forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonLogMovieWatchedDateProps
>(({ movieId, stopPropagation = true, className, ...props }, ref) => {
  const { user } = useAuth();
  const {
    data: activity,
    isLoading,
    isError,
  } = useQuery(
    movieLogOptions({
      userId: user?.id,
      movieId: movieId,
    }),
  );

  if (!activity) return null;

  return (
    <TooltipBox tooltip={'Changer la date de visionnage'}>
      <Button
        disabled={isLoading || isError || activity === undefined}
        variant="outline"
        size="icon"
        asChild
        className={cn('rounded-full flex gap-4', className)}
        {...props}
      >
        <Link href={getLogMovieWatchedDatesHref(movieId)}>
          <CalendarDaysIcon />
        </Link>
      </Button>
    </TooltipBox>
  );
});
ButtonLogMovieWatchedDate.displayName = 'ButtonLogMovieWatchedDate';

export default ButtonLogMovieWatchedDate;

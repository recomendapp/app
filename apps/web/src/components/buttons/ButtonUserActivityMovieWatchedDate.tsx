import * as React from "react"
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { cn } from "@/lib/utils";
import { CalendarDaysIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { movieLogOptions } from "@libs/query-client";
import { useModal } from "@/context/modal-context";
import { ModalLogMovieWatchedDates } from "../Modals/activities/ModalLogMovieWatchedDates";

interface ButtonUserActivityMovieWatchedDateProps
	extends React.ComponentProps<typeof Button> {
		movieId: number;
    	stopPropagation?: boolean;
	}

const ButtonUserActivityMovieWatchedDate = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserActivityMovieWatchedDateProps
>(({ movieId, stopPropagation = true, className, ...props }, ref) => {
	const { user } = useAuth();
  const { openModal } = useModal();
	const {
		data: activity,
		isLoading,
		isError,
	} = useQuery(movieLogOptions({
		userId: user?.id,
		movieId: movieId,
	}));

	if (!activity) return null;

	return (
    <TooltipBox tooltip={'Changer la date de visionnage'}>
      <Button
      disabled={isLoading || isError || activity === undefined}
      variant="outline"
      size="icon"
      onClick={() => openModal(ModalLogMovieWatchedDates, { movieId })}
      className={cn('rounded-full flex gap-4', className)}
      {...props}
      >
        <CalendarDaysIcon />
      </Button>
    </TooltipBox>
  );
});
ButtonUserActivityMovieWatchedDate.displayName = 'ButtonUserActivityMovieWatchedDate';

export default ButtonUserActivityMovieWatchedDate;

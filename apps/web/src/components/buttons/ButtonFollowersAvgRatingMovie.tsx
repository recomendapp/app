import { forwardRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { cn } from "@/lib/utils";
import { useModal } from "@/context/modal-context";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { ModalUserActivityMovieFollowersRating } from "../Modals/activities/ModalUserActivityMovieFollowersRating";
import { useQuery } from "@tanstack/react-query";
import { useMediaMovieFollowersAvgRatingOptions } from "@/api/client/options/mediaOptions";

interface ButtonFollowersAvgRatingMovieProps
	extends React.ComponentProps<typeof Button> {
		movieId: number;
		stopPropagation?: boolean;
	}

const ButtonFollowersAvgRatingMovie = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonFollowersAvgRatingMovieProps
>(({ movieId, stopPropagation = true, onClick, className, ...props }, ref) => {
	const t = useTranslations();
	const { openModal } = useModal();

	const {
		data,
		isLoading
	} = useQuery(useMediaMovieFollowersAvgRatingOptions({
		movieId: movieId,
	}))

	const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		stopPropagation && e.stopPropagation();
		if (onClick) {
			onClick(e);
		} else {
			openModal(ModalUserActivityMovieFollowersRating, { movieId: movieId } );
		}
	}, [stopPropagation, onClick, openModal, movieId]);

	if (!data?.follower_avg_rating || isLoading) return null;

	return (
	<TooltipBox tooltip={upperFirst(t('common.messages.followers_ratings'))}>
		<Button
		ref={ref}
		variant={'outline'}
		className={cn("bg-background! border-accent-blue! text-accent-blue! border-2", className)}
		onClick={handleClick}
		{...props}
		>
			<p className="font-bold text-lg">{data.follower_avg_rating}</p>
		</Button>
	</TooltipBox>
	);
});
ButtonFollowersAvgRatingMovie.displayName = 'ButtonFollowersAvgRatingMovie';

export default ButtonFollowersAvgRatingMovie;

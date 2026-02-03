import { forwardRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { cn } from "@/lib/utils";
import { useModal } from "@/context/modal-context";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useQuery } from "@tanstack/react-query";
import { useMediaTvSeriesFollowersAvgRatingOptions } from "@/api/client/options/mediaOptions";
import { ModalUserActivityTvSeriesFollowersRating } from "../Modals/activities/ModalUserActivityTvSeriesFollowersRating";

interface ButtonFollowersAvgRatingTvSeriesProps
	extends React.ComponentProps<typeof Button> {
		tvSeriesId: number;
		stopPropagation?: boolean;
	}

const ButtonFollowersAvgRatingTvSeries = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonFollowersAvgRatingTvSeriesProps
>(({ tvSeriesId, stopPropagation = true, onClick, className, ...props }, ref) => {
	const t = useTranslations();
	const { openModal } = useModal();

	const {
		data,
		isLoading
	} = useQuery(useMediaTvSeriesFollowersAvgRatingOptions({
		tvSeriesId: tvSeriesId,
	}))

	const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		stopPropagation && e.stopPropagation();
		if (onClick) {
			onClick(e);
		} else {
			openModal(ModalUserActivityTvSeriesFollowersRating, { tvSeriesId: tvSeriesId } );
		}
	}, [stopPropagation, onClick, openModal, tvSeriesId]);

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
ButtonFollowersAvgRatingTvSeries.displayName = 'ButtonFollowersAvgRatingTvSeries';

export default ButtonFollowersAvgRatingTvSeries;

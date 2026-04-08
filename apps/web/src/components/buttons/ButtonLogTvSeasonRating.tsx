import * as React from "react"
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { Icons } from "@/config/icons";
import { cn } from "@/lib/utils";
import { AlertCircleIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
  } from '@/components/ui/dialog';
import { useQuery } from "@tanstack/react-query";
import { tvSeasonLogOptions, useTvSeasonLogSetMutation } from "@libs/query-client";
import { TvSeasonCompact } from "@libs/api-js";

interface ButtonLogTvSeasonRatingProps
	extends React.ComponentProps<typeof Button> {
		tvSeason: TvSeasonCompact;
		stopPropagation?: boolean;
	}

const ButtonLogTvSeasonRating = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonLogTvSeasonRatingProps
>(({ tvSeason, stopPropagation = true, className, ...props }, ref) => {
	const { user } = useAuth();
	const t = useTranslations();
	const [ratingValue, setRatingValue] = React.useState(5);

	const {
		data: activity,
		isLoading,
		isError,
	} = useQuery(tvSeasonLogOptions({
		userId: user?.id,
		tvSeriesId: tvSeason.tvSeriesId,
		seasonNumber: tvSeason.seasonNumber,
	}));

	const { mutateAsync: handleLog, isPending } = useTvSeasonLogSetMutation();	

	const handleRate = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e.stopPropagation();
		await handleLog({
			path: {
				tv_series_id: tvSeason.tvSeriesId,
				season_number: tvSeason.seasonNumber,
			},
			body: {
				rating: ratingValue,
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [tvSeason, ratingValue, stopPropagation, t]);
	const handleUnrate = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e.stopPropagation();
		await handleLog({
			path: {
				tv_series_id: tvSeason.tvSeriesId,
				season_number: tvSeason.seasonNumber,
			},
			body: {
				rating: null,
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [tvSeason, stopPropagation, t]);

	React.useEffect(() => {
		activity?.rating && setRatingValue(activity?.rating);
	  }, [activity]);

	if (!user) return null;

	return (
		<Dialog>
		  <TooltipBox tooltip={activity?.rating ? upperFirst(t('common.messages.edit_rating')) : upperFirst(t('common.messages.add_rating'))}>
			<DialogTrigger asChild>
				<Button
				ref={ref}
				disabled={isLoading || isError || activity === undefined || isPending}
				variant={'outline'}
				size={activity?.rating ? 'default' : 'icon'}
				className={cn(
					activity?.rating ? 'bg-background! border-accent-yellow! text-accent-yellow! border-2' : 'rounded-full',
					className
				)}
				{...props}
				>
					{(isLoading || activity === undefined) ? (
						<Icons.spinner className="animate-spin" />
					) : isError ? (
						<AlertCircleIcon />
					) : activity?.rating ? (
						<p className="font-bold text-lg">{activity?.rating}</p>
					) : (
						<Icons.star />
					)}
				</Button>
			</DialogTrigger>
		  </TooltipBox>
		  <DialogContent>
			<DialogHeader className="relative">
			  <div className="absolute w-full flex justify-center -top-16">
				<p className="absolute top-6 text-2xl text-accent-yellow-foreground font-bold">
				  {ratingValue}
				</p>
				<Icons.star size={80} className="text-accent-yellow fill-accent-yellow" />
			  </div>
			  <DialogTitle className="text-center pt-4">{activity?.rating ? upperFirst(t('common.messages.edit_rating')) : upperFirst(t('common.messages.add_rating'))}</DialogTitle>
			</DialogHeader>
			<div className="grid gap-4 py-4">
			  <div className="flex">
				<MovieRating rating={ratingValue} setRating={setRatingValue} />
			  </div>
			</div>
			<DialogFooter className="flex flex-col justify-center">
			  <DialogClose asChild>
				<Button onClick={async (e) => handleRate(e)}>{upperFirst(t('common.messages.save'))}</Button>
			  </DialogClose>
			  {activity?.rating && (
				<DialogClose asChild>
				  <Button variant="destructive" onClick={async (e) => handleUnrate(e)}>
					{upperFirst(t('common.messages.remove_rating'))}
				  </Button>
				</DialogClose>
			  )}
			</DialogFooter>
		  </DialogContent>
		</Dialog>
	  );
});
ButtonLogTvSeasonRating.displayName = 'ButtonLogTvSeasonRating';

const MovieRating = ({
	rating,
	setRating,
} : {
	rating: number;
	setRating: React.Dispatch<React.SetStateAction<number>>;
}) => {
	const [hover, setHover] = React.useState<number | null>(null);
	const [tmpRating, setTmpRating] = React.useState(rating);
  
	const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
	const handleMouseEnter = (i: number) => {
	  setHover(i);
	  setTmpRating((prev) => {
		if (prev === rating) {
		  return rating;
		} else {
		  return prev;
		}
	  });
	  setRating(i);
	};
  
	const handleMouseLeave = () => {
	  setHover(null);
	  setRating(tmpRating);
	};
  
	return (
	  <div className="flex w-full justify-center">
		{stars.map((i) => {
		  return (
			<label key={i}>
			  <input
				type="radio"
				name="rating"
				className="hidden"
				value={rating}
				onClick={() => {
				  setRating(i);
				  setTmpRating(i);
				}}
			  />
			  <Icons.star
				aria-hidden="true"
				onMouseEnter={() => handleMouseEnter(i)}
				onMouseLeave={handleMouseLeave}
				className={`
				  text-accent-yellow
				  ${i <= (hover || rating) && 'fill-accent-yellow'}
				`}
			  />
			</label>
		  );
		})}
	  </div>
	);
};
  

export default ButtonLogTvSeasonRating;

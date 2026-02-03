import * as React from "react"
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { Link } from "@/lib/i18n/navigation";
import { Icons } from "@/config/icons";
import { usePathname } from '@/lib/i18n/navigation';
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
import { useUserActivityTvSeriesOptions } from "@/api/client/options/userOptions";
import { useQuery } from "@tanstack/react-query";
import { useUserActivityTvSeriesInsertMutation, useUserActivityTvSeriesUpdateMutation } from "@/api/client/mutations/userMutations";

interface ButtonUserActivityTvSeriesRatingProps
	extends React.ComponentProps<typeof Button> {
		tvSeriesId: number;
		stopPropagation?: boolean;
	}

const ButtonUserActivityTvSeriesRating = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserActivityTvSeriesRatingProps
>(({ tvSeriesId, stopPropagation = true, className, ...props }, ref) => {
	const { session } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();
	const [ratingValue, setRatingValue] = React.useState(5);

	const {
		data: activity,
		isLoading,
		isError,
	} = useQuery(useUserActivityTvSeriesOptions({
		userId: session?.user.id,
		tvSeriesId: tvSeriesId,
	}));

	const { mutateAsync: insertActivity, isPending: isInsertPending } = useUserActivityTvSeriesInsertMutation();
	const { mutateAsync: updateActivity, isPending: isUpdatePending } = useUserActivityTvSeriesUpdateMutation();


	const handleRate = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e.stopPropagation();
		if (!session?.user.id) return;
		if (activity) {
			await updateActivity({
				activityId: activity.id,
				rating: ratingValue,
			}, {
				onError: () => {
					toast.error(upperFirst(t('common.messages.an_error_occurred')));
				}
			});
		} else {
			await insertActivity({
				userId: session?.user.id,
				tvSeriesId: tvSeriesId,
				rating: ratingValue,
			}, {
				onError: () => {
					toast.error(upperFirst(t('common.messages.an_error_occurred')));
				}
			});
		}
	}, [activity, insertActivity, tvSeriesId, ratingValue, session, stopPropagation, t, updateActivity]);

	const handleUnrate = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e.stopPropagation();
		if (activity?.review) {
			return toast.error(t('components.media.actions.rating.remove_rating.has_review'));
		}
		await updateActivity({
		  activityId: activity!.id!,
		  rating: null,
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [activity, updateActivity, stopPropagation, t]);

	React.useEffect(() => {
		activity?.rating && setRatingValue(activity?.rating);
	  }, [activity]);

	if (session == null) {
		return (
		<TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
			<Button
			ref={ref}
			size={'icon'}
			variant={'outline'}
			className={cn('rounded-full', className)}
			asChild
			{...props}
			>
			<Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
				<Icons.star />
			</Link>
			</Button>
		</TooltipBox>
		)
	}

	return (
		<Dialog>
		  <TooltipBox tooltip={activity?.rating ? upperFirst(t('common.messages.edit_rating')) : upperFirst(t('common.messages.add_rating'))}>
			<DialogTrigger asChild>
				<Button
				ref={ref}
				disabled={isLoading || isError || activity === undefined || isInsertPending || isUpdatePending}
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
ButtonUserActivityTvSeriesRating.displayName = 'ButtonUserActivityTvSeriesRating';

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
  

export default ButtonUserActivityTvSeriesRating;

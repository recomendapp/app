import * as React from "react"
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { Profile, UserActivityMovie, UserReviewMovie,  } from "@recomendapp/types";
import { WithLink } from "../utils/WithLink";
import { CardUser } from "./CardUser";
import { useFormatter, useNow } from "next-intl";
import { generateText } from "@tiptap/react";
import { IconMediaRating } from "@/components/Media/icons/IconMediaRating";
import ButtonUserReviewMovieLike from "../buttons/ButtonUserReviewMovieLike";
import { generateJSON } from "@tiptap/html";
import { EDITOR_EXTENSIONS } from "../tiptap/TiptapExtensions";

interface CardReviewMovieProps
	extends React.ComponentProps<typeof Card> {
		variant?: "default";
		review: UserReviewMovie;
		activity: UserActivityMovie;
		author: Profile;
		linked?: boolean;
		url: string;
	}

const CardReviewMovieDefault = React.forwardRef<
	HTMLDivElement,
	Omit<CardReviewMovieProps, "variant" | "url">
>(({ className, review, activity, author, linked, children, ...props }, ref) => {
	const now = useNow({ updateInterval: 1000 * 10 });
	const format = useFormatter();
	return (
		<Card
			ref={ref}
			className={cn(
				"@container/review flex-row gap-2 p-1 hover:bg-muted-hover",
				className
			)}
			{...props}
		>
			<div className="flex flex-col items-center gap-1">
				<IconMediaRating
				rating={activity?.rating}
				className="h-fit"
				/>
				<div className="bg-muted-hover h-full w-0.5 rounded-full"></div>
			</div>
			<div className="w-full flex flex-col gap-1">
				<div className="w-full flex justify-between items-center gap-2">
					<CardUser variant="inline" user={author} />
					<div className='text-sm text-muted-foreground'>
					{format.relativeTime(new Date(review?.created_at ?? ''), now)}
					</div>
				</div>
				{review?.title ? (
					<p className="font-semibold line-clamp-1">
						{review?.title}
					</p>
				) : null}
				<Overview data={review?.body} />
				<div className="flex items-center justify-end m-1">
					<ButtonUserReviewMovieLike reviewId={review?.id} reviewLikesCount={review.likes_count} />
				</div>
			</div>
		</Card>
	);
});
CardReviewMovieDefault.displayName = "CardReviewMovieDefault";


const CardReviewMovie = React.forwardRef<
	HTMLDivElement,
	CardReviewMovieProps
>(({ className, review, linked = true, variant = "default", url, ...props }, ref) => {
	return (
	<WithLink href={linked ? url : undefined} withOnClick>
		{variant === "default" ? (
			<CardReviewMovieDefault ref={ref} className={className} review={review} linked={linked} {...props} />
		) : null}
	</WithLink>
	);
});
CardReviewMovie.displayName = "CardReviewMovie";

export {
	type CardReviewMovieProps,
	CardReviewMovie,
	CardReviewMovieDefault,
}

export function Overview({ data }: { data: string }) {
  const tiptapJson = generateJSON(data, EDITOR_EXTENSIONS);
  const rawText = generateText(tiptapJson, EDITOR_EXTENSIONS);

  return (
	<div className=" whitespace-pre-line text-justify">
	  <p className="line-clamp-3">{rawText}</p>
	</div>
  );
}

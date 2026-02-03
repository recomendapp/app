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
import { useUserReviewMovieLikeDeleteMutation, useUserReviewMovieLikeInsertMutation } from "@/api/client/mutations/userMutations";
import { useUserReviewMovieLikeOptions } from "@/api/client/options/userOptions";
import { useQuery } from "@tanstack/react-query";

interface ButtonUserReviewMovieLikeProps
	extends React.ComponentProps<typeof Button> {
		reviewId: number;
		reviewLikesCount?: number;
	}

const ButtonUserReviewMovieLike = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserReviewMovieLikeProps
>(({ reviewId, reviewLikesCount, className, ...props }, ref) => {
	const { session } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();
	const {
		data: like,
		isLoading,
		isError,
	} = useQuery(useUserReviewMovieLikeOptions({
		reviewId: reviewId,
		userId: session?.user.id,
	}));
	const [likeCount, setLikeCount] = React.useState(reviewLikesCount ?? undefined);
	const { mutateAsync: insertLike, isPending: isInsertPending } = useUserReviewMovieLikeInsertMutation();
	const { mutateAsync: deleteLike, isPending: isDeletePending } = useUserReviewMovieLikeDeleteMutation();

	const handleLike = React.useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!session) {
			toast.error(upperFirst(t('common.messages.not_logged_in')));
			return;
		}
		await insertLike({
			userId: session.user.id,
			reviewId: reviewId,
		}, {
			onSuccess: () => {
				setLikeCount((prev) => (prev ?? 0) + 1);
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [insertLike, reviewId, session, t]);

	const handleUnlike = React.useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!like) {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
			return;
		}
		await deleteLike({
			likeId: like.id
		}, {
			onSuccess: () => {
				setLikeCount((prev) => (prev ?? 0) - 1);
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [deleteLike, like, t]);

	if (session == null) {
		return (
		<TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
			<Button
			ref={ref}
			size={'icon'}
			variant={'outline'}
			className={cn(
				"rounded-full text-muted-foreground hover:text-accent-pink",
				className
			)}
			asChild
			{...props}
			>
			<Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
				<Icons.like size={20} />
				{likeCount != undefined ? ` ${likeCount}` : null}
			</Link>
			</Button>
		</TooltipBox>
		)
	}

	return (
		<TooltipBox tooltip={like ? upperFirst(t('common.messages.unlike')) : upperFirst(t('common.messages.like'))}>
			<Button
			ref={ref}
			onClick={like ? handleUnlike : handleLike}
			disabled={isLoading || isError || like === undefined || isInsertPending || isDeletePending}
			size="sm"
			variant={'outline'}
			className={cn(
				"rounded-full",
				like ? 'text-accent-pink hover:text-accent-pink/50' : 'text-muted-foreground hover:text-accent-pink',
				className
			)}
			{...props}
			>
				{(isLoading || like === undefined) ? (
				<Icons.spinner size={20} className="animate-spin" />
				) : isError ? (
				<AlertCircleIcon size={20}/>
				) : (
				<Icons.like
				size={20}
				className={`
				${like ? 'fill-accent-pink' : 'fill-none'}
				`}
				/>
				)}
				{likeCount != undefined ? ` ${likeCount}` : null}
			</Button>
		</TooltipBox>
	);
});
ButtonUserReviewMovieLike.displayName = 'ButtonUserReviewMovieLike';

export default ButtonUserReviewMovieLike;

import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useUserActivityMovieInsertMutation, useUserActivityMovieUpdateMutation } from "apps/mobile/src/api/users/userMutations";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { MediaMovie } from "@recomendapp/types";
import { useQueryClient } from "@tanstack/react-query";
import { upperFirst } from "lodash";
import { useSharedValue } from "react-native-reanimated";
import { useTranslations } from "use-intl";
import { usePathname, useRouter } from "expo-router";
import { Button } from "apps/mobile/src/components/ui/Button";
import { useToast } from "apps/mobile/src/components/Toast";
import { forwardRef, useCallback } from "react";
import tw from "apps/mobile/src/lib/tw";
import { useUserActivityMovieQuery } from "apps/mobile/src/api/users/userQueries";
import { userKeys } from "apps/mobile/src/api/users/userKeys";

interface ButtonUserActivityMovieLikeProps
	extends React.ComponentProps<typeof Button> {
		movie: MediaMovie;
	}

const ButtonUserActivityMovieLike = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserActivityMovieLikeProps
>(({ movie, icon = Icons.like, variant = "outline", size = "icon", style, onPress: onPressProps, iconProps, ...props }, ref) => {
	const { colors } = useTheme();
	const { session } = useAuth();
	const toast = useToast();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations();
	const queryClient = useQueryClient();
	const {
		data: activity,
	} = useUserActivityMovieQuery({
		userId: session?.user.id,
		movieId: movie.id,
	});
	const { mutateAsync: insertActivity } = useUserActivityMovieInsertMutation();
	const { mutateAsync: updateActivity } = useUserActivityMovieUpdateMutation();
	const isLiked = useSharedValue(activity?.is_liked ? 1 : 0);

	const handleLike = useCallback(async () => {
		if (!session) return;
		isLiked.value = 1;
		if (activity) {
			await updateActivity({
				activityId: activity.id,
				isLiked: true,
			}, {
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: userKeys.heartPicks({ userId: session.user.id, type: 'movie' })
					});
				},
				onError: () => {
					isLiked.value = 0;
					toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
				}
			});
		} else {
			await insertActivity({
				userId: session?.user.id,
				movieId: movie.id,
				isLiked: true,
			}, {
				onSuccess: (data) => {
					queryClient.invalidateQueries({
						queryKey: userKeys.heartPicks({ userId: session.user.id, type: 'movie' })
					});
				},
				onError: () => {
					isLiked.value = 0;
					toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
				}
			});
		}
	}, [activity, insertActivity, movie.id, queryClient, session, toast, t, updateActivity, isLiked]);
	const handleUnlike = useCallback(async () => {
		if (!session) return;
		if (!activity) return;
		isLiked.value = 0;
		await updateActivity({
			activityId: activity.id,
			isLiked: false,
		}, {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: userKeys.heartPicks({ userId: session.user.id, type: 'movie' })
				});
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
				isLiked.value = 1;
			}
		});
	}, [activity, queryClient, session, toast, t, updateActivity, isLiked]);

	return (
		<Button
		ref={ref}
		variant={variant}
		icon={icon}
		size={size}
		onPress={async (e) => {
			if (session) {
				if (activity?.is_liked) {
					await handleUnlike()
				 } else {
					await handleLike();
				 }
			} else {
				router.push({
					pathname: '/auth',
					params: {
						redirect: pathname,
					},
				});
			}
			onPressProps?.(e);
		}}
		iconProps={{
			fill: activity?.is_liked ? colors.foreground : 'transparent',
			...iconProps,
		}}
		style={{
			...(activity?.is_liked ? { backgroundColor: colors.accentPink } : undefined),
			...tw`rounded-full`,
			...style,
		}}
		{...props}
		/>
	);
});
ButtonUserActivityMovieLike.displayName = 'ButtonUserActivityMovieLike';

export default ButtonUserActivityMovieLike;

import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { upperFirst } from "lodash";
import { useSharedValue } from "react-native-reanimated";
import { useTranslations } from "use-intl";
import { usePathname, useRouter } from "expo-router";
import { Button } from "apps/mobile/src/components/ui/Button";
import { useToast } from "apps/mobile/src/components/Toast";
import { forwardRef, useCallback } from "react";
import tw from "apps/mobile/src/lib/tw";
import { MovieCompact } from "@libs/api-js";
import { movieLogOptions, useMovieLogSetMutation } from "@libs/query-client";

interface ButtonUserLogMovieLikeProps
	extends React.ComponentProps<typeof Button> {
		movie: MovieCompact;
	}

const ButtonUserLogMovieLike = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserLogMovieLikeProps
>(({ movie, icon = Icons.like, variant = "outline", size = "icon", style, onPress: onPressProps, iconProps, ...props }, ref) => {
	const { colors } = useTheme();
	const { user } = useAuth();
	const toast = useToast();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations();
	const {
		data: log,
	} = useQuery(movieLogOptions({
		userId: user?.id,
		movieId: movie.id,
	}));
	const { mutateAsync: handleLog } = useMovieLogSetMutation();
	const isLiked = useSharedValue(log?.isLiked ? 1 : 0);

	const toggle = useCallback(async () => {
		if (!user) return;
		const newValue = log?.isLiked !== undefined ? !log.isLiked : true;
		await handleLog({
			path: {
				movie_id: movie.id,
			},
			body: {
				isLiked: newValue,
			},
		}, {
			onSuccess: () => {
				isLiked.value = newValue ? 1 : 0;
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [handleLog, movie.id, toast, t, user, log, isLiked]);

	return (
		<Button
		ref={ref}
		variant={variant}
		icon={icon}
		size={size}
		onPress={async (e) => {
			if (user) {
				await toggle();
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
			fill: log?.isLiked ? colors.foreground : 'transparent',
			...iconProps,
		}}
		style={{
			...(log?.isLiked ? { backgroundColor: colors.accentPink } : undefined),
			...tw`rounded-full`,
			...style,
		}}
		{...props}
		/>
	);
});
ButtonUserLogMovieLike.displayName = 'ButtonUserLogMovieLike';

export default ButtonUserLogMovieLike;

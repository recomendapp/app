import { Alert } from "react-native";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { upperFirst } from "lodash";
import tw from "apps/mobile/src/lib/tw";
import { useTranslations } from "use-intl";
import { usePathname, useRouter } from "expo-router";
import { Button } from "apps/mobile/src/components/ui/Button";
import { useToast } from "apps/mobile/src/components/Toast";
import { forwardRef, useCallback } from "react";
import { MovieCompact } from "@packages/api-js";
import { useQuery } from "@tanstack/react-query";
import { movieLogOptions, useMovieLogDeleteMutation, useMovieLogSetMutation } from "@libs/query-client";

interface ButtonUserLogMovieWatchProps
	extends React.ComponentProps<typeof Button> {
		movie: MovieCompact;
	}

const ButtonUserLogMovieWatch = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserLogMovieWatchProps
>(({ movie, icon = Icons.Check, variant = "outline", size = "icon", style, onPress: onPressProps, ...props }, ref) => {
	const { colors, mode } = useTheme();
	const toast = useToast();
	const { user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations();
	const {
		data: log,
	} = useQuery(movieLogOptions({
		userId: user?.id,
		movieId: movie.id!,
	}));
	const { mutateAsync: watch } = useMovieLogSetMutation();
	const { mutateAsync: unwatch } = useMovieLogDeleteMutation();

	const handleWatch = useCallback(async () => {
		await watch({
			path: {
				movie_id: movie.id,
			},
			body: {}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [movie.id, toast, t, watch]);

	const handleUnwatch = useCallback(async () => {
		Alert.alert(
			upperFirst(t('common.messages.are_u_sure')),
			upperFirst(t('components.media.actions.watch.remove_from_watched.description')),
			[
				{
					text: upperFirst(t('common.messages.cancel')),
					style: 'cancel',
				},
				{
					text: upperFirst(t('common.messages.confirm')),
					onPress: async () => {
						await unwatch({
							path: {
								movie_id: movie.id,
							},
						}, {
							onError: () => {
								toast.error(upperFirst(t('common.messages.an_error_occurred')));
							}
						});
					},
					style: 'destructive',
				},
			], {
				userInterfaceStyle: mode,
			}
		);
	}, [movie.id, toast, t, unwatch, mode]);

	return (
		<Button
		ref={ref}
		variant={variant}
		size={size}
		icon={icon}
		onPress={async (e) => {
			if (user) {
				if (log) {
					await handleUnwatch()
				} else {
					await handleWatch()
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
		style={{
			...(log ? { backgroundColor: colors.accentBlue } : undefined),
			...tw`rounded-full`,
			...style,
		}}
		{...props}
		/>
	);
});
ButtonUserLogMovieWatch.displayName = 'ButtonUserLogMovieWatch';

export default ButtonUserLogMovieWatch;

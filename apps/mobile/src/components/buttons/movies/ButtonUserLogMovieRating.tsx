import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import tw from "apps/mobile/src/lib/tw";
import { usePathname, useRouter } from "expo-router";
import { Button } from "apps/mobile/src/components/ui/Button";
import BottomSheetRating from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetRating";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { useToast } from "apps/mobile/src/components/Toast";
import { forwardRef, useCallback } from "react";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { Text } from "apps/mobile/src/components/ui/text";
import { MovieCompact } from "@packages/api-js";
import { useQuery } from "@tanstack/react-query";
import { movieLogOptions, useMovieLogSetMutation } from "@libs/query-client";

interface ButtonUserLogMovieRatingProps
	extends Omit<React.ComponentProps<typeof Button>, 'size'> {
		movie: MovieCompact;
	}

const ButtonUserLogMovieRating = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserLogMovieRatingProps
>(({ movie, variant = "outline", style, onPress: onPressProps, iconProps, ...props }, ref) => {
	const { user } = useAuth();
	const { colors } = useTheme();
	const toast = useToast();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	// Requests
	const {
		data: log,
	} = useQuery(movieLogOptions({
		userId: user?.id,
		movieId: movie.id,
	}));
	// Mutations
	const { mutateAsync: rate } = useMovieLogSetMutation();
	// Handlers
	const handleRate = useCallback(async (rating: number | null) => {
		await rate({
			path: {
				movie_id: movie.id,
			},
			body: {
				rating,
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});	
	}, [movie.id, toast, t, rate]);

	return (
		<Button
		ref={ref}
		variant={variant}
		iconProps={iconProps}
		size={log?.rating ? 'default' : 'icon'}
		icon={!log?.rating ? Icons.Star : undefined}
		onPress={(e) => {
			if (user) {
				openSheet(BottomSheetRating, {
					media: {
						title: movie.title || '',
						imageUrl: getTmdbImage({ path: movie?.posterPath, size: 'w342' }) || '',
						type: 'movie',
					},
					onRatingChange: handleRate,
					rating: log?.rating || null,
				});
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
			...(!log?.rating ? tw`rounded-full` : { backgroundColor: colors.accentYellowForeground, borderColor: colors.accentYellow }),
			...style,
		}}
		{...props}
		>
			{log?.rating ? (
				<Text style={[tw`font-bold`, { color: colors.accentYellow }]}>{log.rating}</Text>
			) : null}
		</Button>
	);
});
ButtonUserLogMovieRating.displayName = 'ButtonUserLogMovieRating';

export default ButtonUserLogMovieRating;

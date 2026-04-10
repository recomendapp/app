import ReviewForm from "apps/mobile/src/components/screens/review/ReviewForm";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import tw from "apps/mobile/src/lib/tw";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native"
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { useToast } from "apps/mobile/src/components/Toast";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { movieOptions, useMovieReviewUpsertMutation, userMovieLogOptions } from "@libs/query-client";

const MovieReviewScreen = () => {
	const { user } = useAuth();
	const router = useRouter();
	const t = useTranslations();
	const toast = useToast();
	const { film_id } = useLocalSearchParams();
	const { id: filmId} = getIdFromSlug(film_id as string);
	// Requetes
	const {
		data: movie,
		isLoading: movieLoading,
	} = useQuery(movieOptions({
		movieId: filmId,
	}));
	const {
		data: log,
		isLoading,
	} = useQuery(userMovieLogOptions({
		userId: user?.id,
		movieId: movie?.id,
	}));
	const loading = movieLoading || movie === undefined || isLoading || log === undefined;
	// Mutations
	const { mutateAsync: upsertReview } = useMovieReviewUpsertMutation();

	// Handlers
	const handleSave = useCallback(async (data: { title: string; body: string }) => {
		if (!movie) return;
		await upsertReview({
			path: {
				movie_id: movie.id,
			},
			body: {
				title: data.title,
				body: data.body,
				isSpoiler: false,
			}
		}, {
			onSuccess: (review) => {
				router.replace({
					pathname: '/user/[username]/film/[film_id]',
					params: {
						username: user?.username!,
						film_id: movie.id,
					}
				});
			},
			onError: (error) => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
			}
		});
	}, [upsertReview, router, movie, toast, t, user?.username]);

	if (movie === null) {
		return (
			<Redirect href={'..'} />
		)
	}
	if (loading) {
		return (
			<View style={tw`flex-1 items-center justify-center`}>
				<Icons.Loader />
			</View>
		);
	};
	return (
	<>
		<Stack.Screen
		options={{
			title: log?.review
				? upperFirst(t('common.messages.edit_review'))
				: upperFirst(t('common.messages.add_review'))
		}}
		/>
		<ReviewForm
		review={log?.review}
		isWatched={!!log}
		type="movie"
		movie={movie}
		onSave={handleSave}
		/>
	</>
	)
};

export default MovieReviewScreen;
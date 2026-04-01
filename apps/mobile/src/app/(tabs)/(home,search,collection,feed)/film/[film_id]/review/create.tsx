import ReviewForm from "apps/mobile/src/components/screens/review/ReviewForm";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import tw from "apps/mobile/src/lib/tw";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native"
import { useUserReviewMovieUpsertMutation } from "apps/mobile/src/api/users/userMutations";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { useToast } from "apps/mobile/src/components/Toast";
import { useCallback } from "react";
import { useMediaMovieDetailsQuery } from "apps/mobile/src/api/medias/mediaQueries";
import { useUserActivityMovieQuery } from "apps/mobile/src/api/users/userQueries";

const ReviewMovieCreateScreen = () => {
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
	} = useMediaMovieDetailsQuery({
		movieId: filmId,
	});
	const {
		data: activity,
		isLoading: activityLoading,
	} = useUserActivityMovieQuery({
		userId: user?.id,
		movieId: movie?.id,
	});
	const loading = movieLoading || movie === undefined || activityLoading || activity === undefined;
	// Mutations
	const { mutateAsync: insertReview } = useUserReviewMovieUpsertMutation({
		movieId: movie?.id,
	});

	// Handlers
	const handleSave = useCallback(async (data: { title: string; body: string }) => {
		await insertReview({
			title: data.title || null,
			body: data.body,
		}, {
			onSuccess: (review) => {
				router.replace(`/film/${movie?.slug || movie?.id}/review/${review.id}`);
			},
			onError: (error) => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
			}
		});
	}, [insertReview, router, movie?.slug, movie?.id, toast, t]);

	if (movie === null) {
		return (
			<Redirect href={'..'} />
		)
	}
	if (activity?.review) {
		return (
			<Redirect href={{ pathname: '/film/[film_id]/review/[review_id]', params: { film_id: movie?.slug || movie?.id!, review_id: activity?.review?.id }}} />
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
	<ReviewForm
	type="movie"
	activity={activity}
	movie={movie}
	onSave={handleSave}
	/>
	)
};

export default ReviewMovieCreateScreen;
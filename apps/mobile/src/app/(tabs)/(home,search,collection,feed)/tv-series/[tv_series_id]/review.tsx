import ReviewForm from "apps/mobile/src/components/screens/review/ReviewForm";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import tw from "apps/mobile/src/lib/tw";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native"
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { useToast } from "apps/mobile/src/components/Toast";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { tvSeriesOptions, userTvSeriesLogOptions, useTvSeriesReviewUpsertMutation } from "@libs/query-client";

const TvSeriesReviewScreen = () => {
	const { user } = useAuth();
	const router = useRouter();
	const t = useTranslations();
	const toast = useToast();
	const { tv_series_id } = useLocalSearchParams();
	const { id: tvSeriesId } = getIdFromSlug(tv_series_id as string);
	// Requetes
	const {
		data: tvSeries,
		isLoading: tvSeriesLoading,
	} = useQuery(tvSeriesOptions({
		tvSeriesId,
	}));
	const {
		data: log,
		isLoading,
	} = useQuery(userTvSeriesLogOptions({
		userId: user?.id,
		tvSeriesId: tvSeries?.id,
	}));
	const loading = tvSeriesLoading || tvSeries === undefined || isLoading || log === undefined;
	// Mutations
	const { mutateAsync: upsertReview } = useTvSeriesReviewUpsertMutation();

	// Handlers
	const handleSave = useCallback(async (data: { title: string; body: string }) => {
		if (!tvSeries) return;
		await upsertReview({
			path: {
				tv_series_id: tvSeries.id,
			},
			body: {
				title: data.title,
				body: data.body,
				isSpoiler: false,
			}
		}, {
			onSuccess: (review) => {
				router.replace({
					pathname: '/user/[username]/tv-series/[tv_series_id]',
					params: {
						username: user?.username!,
						tv_series_id: tvSeries.id,
					}
				});
			},
			onError: (error) => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
			}
		});
	}, [upsertReview, router, tvSeries, toast, t, user?.username]);

	if (tvSeries === null) {
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
	<ReviewForm
	review={log?.review}
	isWatched={!!log}
	type="tv_series"
	tvSeries={tvSeries}
	onSave={handleSave}
	/>
	)
};

export default TvSeriesReviewScreen;
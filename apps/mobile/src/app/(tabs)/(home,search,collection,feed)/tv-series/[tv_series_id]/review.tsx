import ReviewForm from "apps/mobile/src/components/screens/review/ReviewForm";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import tw from "apps/mobile/src/lib/tw";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, View } from "react-native"
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { useToast } from "apps/mobile/src/components/Toast";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { tvSeriesOptions, userTvSeriesLogOptions, useTvSeriesReviewDeleteMutation, useTvSeriesReviewUpsertMutation } from "@libs/query-client";

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
	const { mutateAsync: deleteReview } = useTvSeriesReviewDeleteMutation();

	// Handlers
	const handleSave = useCallback(async (data: { title: string; body: string }) => {
		if (!tvSeries) return;
		const isEditing = !!log?.review;
		await upsertReview({
			path: {
				tv_series_id: tvSeries.id,
			},
			body: {
				title: data.title.trim() || null,
				body: data.body,
				isSpoiler: false,
			}
		}, {
			onSuccess: () => {
				if (isEditing && router.canGoBack()) {
                    router.back();
                } else {
					router.replace({
						pathname: '/user/[username]/tv-series/[tv_series_id]',
						params: {
							username: user?.username!,
							tv_series_id: tvSeries.id,
						}
					});
				}
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
			}
		});
	}, [upsertReview, router, tvSeries, toast, t, user?.username]);
	const handleDelete = useCallback(async () => {
		if (!log?.review) return;
		Alert.alert(
			upperFirst(t('common.messages.are_u_sure')),
			undefined,
			[
				{
					text: upperFirst(t('common.messages.cancel')),
					style: 'cancel',
				},
				{
					text: upperFirst(t('common.messages.delete')),
					onPress: async () => {
						await deleteReview({
							path: {
								tv_series_id: log.tvSeriesId,
							}
						}, {
							onSuccess: () => {
								toast.success(upperFirst(t('common.messages.deleted')));
								if (router.canGoBack()) {
									router.back();
								} else {
									router.replace({
										pathname: '/tv-series/[tv_series_id]',
										params: {
											tv_series_id: log.tvSeriesId,
										}
									});
								}
							},
							onError: () => {
								toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
							}
						});
					},
					style: 'destructive',
				}
			]
		)
	}, [deleteReview, router, log, toast, t]);

	if (tvSeries === null) {
		return (
			<Redirect href={'..'} />
		)
	}
	return (
	<>
		<Stack.Screen
		options={{
			title: log?.review
				? upperFirst(t('common.messages.edit_review'))
				: upperFirst(t('common.messages.add_review'))
		}}
		/>
		{loading ? (
			<View style={tw`flex-1 items-center justify-center`}>
				<Icons.Loader />
			</View>
		) : (
			<ReviewForm
			review={log?.review}
			isWatched={!!log}
			type="tv_series"
			tvSeries={tvSeries}
			onSave={handleSave}
			onDelete={handleDelete}
			/>
		)}
	</>
	)
};

export default TvSeriesReviewScreen;
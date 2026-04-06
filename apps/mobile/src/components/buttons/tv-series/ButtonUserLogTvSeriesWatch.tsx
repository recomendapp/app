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
import { TvSeriesCompact } from "@packages/api-js";
import { useQuery } from "@tanstack/react-query";
import { tvSeriesLogOptions, useTvSeriesLogDeleteMutation, useTvSeriesLogSetMutation } from "@libs/query-client";

interface ButtonUserLogTvSeriesWatchProps
	extends React.ComponentProps<typeof Button> {
		tvSeries: TvSeriesCompact;
	}

const ButtonUserLogTvSeriesWatch = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserLogTvSeriesWatchProps
>(({ tvSeries, icon = Icons.Check, variant = "outline", size = "icon", style, onPress: onPressProps, ...props }, ref) => {
	const toast = useToast();
	const { colors, mode } = useTheme();
	const { user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations();
	const {
		data: log,
	} = useQuery(tvSeriesLogOptions({
		userId: user?.id,
		tvSeriesId: tvSeries.id!,
	}));
	const { mutateAsync: watch } = useTvSeriesLogSetMutation();
	const { mutateAsync: unwatch } = useTvSeriesLogDeleteMutation();

	const handleWatch = useCallback(async () => {
		await watch({
			path: {
				tv_series_id: tvSeries.id,
			},
			body: {}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [tvSeries.id, toast, t, watch]);

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
								tv_series_id: tvSeries.id,
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
	}, [tvSeries.id, unwatch, mode, toast, t]);

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
ButtonUserLogTvSeriesWatch.displayName = 'ButtonUserLogTvSeriesWatch';

export default ButtonUserLogTvSeriesWatch;

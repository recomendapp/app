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
import { TvSeriesCompact } from "@libs/api-js";
import { tvSeriesLogOptions, useTvSeriesLogSetMutation } from "@libs/query-client";

interface ButtonUserLogTvSeriesLikeProps
	extends React.ComponentProps<typeof Button> {
		tvSeries: TvSeriesCompact;
	}

const ButtonUserLogTvSeriesLike = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserLogTvSeriesLikeProps
>(({ tvSeries, icon = Icons.like, variant = "outline", size = "icon", style, onPress: onPressProps, iconProps, ...props }, ref) => {
	const { colors } = useTheme();
	const { user } = useAuth();
	const toast = useToast();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations();
	const {
		data: log,
	} = useQuery(tvSeriesLogOptions({
		userId: user?.id,
		tvSeriesId: tvSeries.id,
	}));
	const { mutateAsync: handleLog } = useTvSeriesLogSetMutation();
	const isLiked = useSharedValue(log?.isLiked ? 1 : 0);

	const toggle = useCallback(async () => {
		if (!user) return;
		const newValue = log?.isLiked !== undefined ? !log.isLiked : true;
		await handleLog({
			path: {
				tv_series_id: tvSeries.id,
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
	}, [handleLog, tvSeries.id, toast, t, user, log, isLiked]);

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
ButtonUserLogTvSeriesLike.displayName = 'ButtonUserLogTvSeriesLike';

export default ButtonUserLogTvSeriesLike;

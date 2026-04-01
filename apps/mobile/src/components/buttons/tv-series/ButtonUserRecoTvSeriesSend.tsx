import React from "react"
import { Pressable } from "react-native";
import { Icons } from "apps/mobile/src/constants/Icons";
import { MediaTvSeries } from "@recomendapp/types";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { usePathname, useRouter } from "expo-router";
import { Button } from "apps/mobile/src/components/ui/Button";
import tw from "apps/mobile/src/lib/tw";

interface ButtonUserRecoTvSeriesSendProps
	extends React.ComponentProps<typeof Button> {
		tvSeries: MediaTvSeries;
	}

const ButtonUserRecoTvSeriesSend = React.forwardRef<
	React.ComponentRef<typeof Pressable>,
	ButtonUserRecoTvSeriesSendProps
>(({ tvSeries, icon = Icons.Reco, variant = "outline", size = "icon", style, onPress: onPressProps, ...props }, ref) => {
	const { session } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	return (
		<Button
		ref={ref}
		variant={variant}
		icon={icon}
		size={size}
		onPress={(e) => {
			if (session) {
				tvSeries.id && router.push({
					pathname: '/reco/send/tv-series/[tv_series_id]',
					params: {
						tv_series_id: tvSeries.id,
						tv_series_name: tvSeries.name,
					}
				})
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
			...tw`rounded-full`,
			...style,
		}}
		{...props}
		/>
	);
});
ButtonUserRecoTvSeriesSend.displayName = 'ButtonUserRecoTvSeriesSend';

export default ButtonUserRecoTvSeriesSend;

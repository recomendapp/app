'use client';

import { useAuth } from "@/context/auth-context";
import { siteConfig } from "@/config/site";
import { useNow, useTranslations } from "next-intl";
import { useUI } from "@/context/ui-context";
import HeaderRightSide from "@/components/Header/HeaderRightSide";
import { WidgetRecomendShowcase } from "@/components/widgets/WidgetRecomendShowcase";
import { WidgetUserFriendsPlaylists } from "@/components/widgets/WIdgetUserFriendsPlaylists";
import { WidgetUserFeed } from "@/components/widgets/WidgetUserFeed";
import { WidgetUserDiscovery } from "@/components/widgets/WidgetUserDiscovery";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { upperFirst } from "lodash";
import { WidgetMostRecommended } from "@/components/widgets/WidgetMostRecommended";
import { WidgetUserRecos } from "@/components/widgets/WidgetUserRecos";
import { WidgetUserWatchlist } from "@/components/widgets/WidgetUserWatchlist";
import { useMemo } from "react";

export default function Home() {
	const { session, user, customerInfo } = useAuth();
	const { device } = useUI();
	const t = useTranslations();
	const now = useNow({ updateInterval: 1000 * 60 });
	const getTimeOfDay = useMemo((): string => {
		const hour = now.getHours();
		if (hour < 5) return 'night';
		if (hour < 12) return 'morning';
		if (hour < 18) return 'afternoon';
		return 'evening';
	}, [now]);

	return (
		<div className="p-4 gap-4 gap-x-8 grid grid-cols-1 @4xl/main:grid-cols-2">
			<div className="flex justify-between items-center w-full">
				<h2 className="text-xl md:text-4xl break-all line-clamp-2">
					{session ? upperFirst(t('common.messages.greeting_with_name', { timeOfDay: getTimeOfDay, name: user?.full_name! })) : upperFirst(t('common.messages.welcome_to_app', { app: siteConfig.name }))}
				</h2>
				{device === "mobile" ? <HeaderRightSide /> : null}
			</div>
			<WidgetMostRecommended className='col-span-full' />
			{!session ? (
				// Only non-logged users
				<>
				<Button className="col-span-full m-auto max-w-lg" asChild>
					<Link href="/auth/login">{upperFirst(t('common.messages.get_started_its_free'))}</Link>
				</Button>
				<WidgetRecomendShowcase className='col-span-full'/>
				</>
			) : null}
			{session ? (
				// Only logged users
				<>
				<WidgetUserRecos />
				<WidgetUserWatchlist />
				<WidgetUserFriendsPlaylists />
				<WidgetUserFeed />
				<WidgetUserDiscovery className="h-[600px]" />
				</>
			) : null}
		</div>
	);
}
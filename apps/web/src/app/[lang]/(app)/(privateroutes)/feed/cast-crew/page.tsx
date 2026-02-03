'use client'

import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import Loader from "@/components/Loader";
import { FeedCastCrewItem } from "./_components/FeedCastCrewItem";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useUserMyFeedCastCrewOptions } from "@/api/client/options/userOptions";
import { UserFeedCastCrew } from "@recomendapp/types";

export default function FeedPersons() {
	const { customerInfo } = useAuth();
	const router = useRouter();
	const t = useTranslations();

	const { ref, inView } = useInView();

	const {
		data: feed,
		isLoading,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(useUserMyFeedCastCrewOptions({
		enabled: !!customerInfo?.entitlements.active['premium'],
	}));

	useEffect(() => {
		if (inView && hasNextPage)
			fetchNextPage();
	}, [inView, hasNextPage, feed, fetchNextPage]);

	useEffect(() => {
		if (customerInfo && !customerInfo.entitlements.active['premium']) {
			router.replace('/upgrade');
		}
	}, [customerInfo]);

	if (isLoading || !customerInfo?.entitlements.active['premium']) {
		return (
			<div className="flex items-center h-full">
				<Loader />
			</div>
		)
	}

	return (
		<div className="w-full max-w-2xl">
			{feed?.pages[0]?.length ? (
				<div className="flex flex-col gap-4">
					{feed.pages.map((page, i) => (
						page?.map((activity, index) => (
							<FeedCastCrewItem
							key={index}
							ref={(i === feed.pages.length - 1) && (index === page.length - 1) ? ref : undefined }
							activity={activity as UserFeedCastCrew}
							/>
						))
					))}
				</div>
			) : (
				<div className="text-center text-muted-foreground">
				{upperFirst(t('common.messages.is_empty'))}
				</div>
			)}
		</div>
	);
}

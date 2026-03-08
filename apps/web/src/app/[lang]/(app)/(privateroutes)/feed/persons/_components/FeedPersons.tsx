'use client'

import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userFeedPersonsInfiniteOptions } from "@libs/query-client";
import { Icons } from "@/config/icons";
import { FeedPersonsItem } from "./FeedPersonsItem";

export default function FeedPersons() {
	const { user } = useAuth();
	const t = useTranslations();

	const { ref, inView } = useInView();

	const {
		data: feed,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetching,
	} = useInfiniteQuery({
		...userFeedPersonsInfiniteOptions({
			userId: user?.id,
		}),
		enabled: !!user?.isPremium,
	});
	const flattenFeed = feed?.pages.flatMap(page => page.data) || [];

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	if (isLoading) {
		return (
			<div className="flex items-center h-full">
				<Icons.loader />
			</div>
		)
	}

	return (
		<div className="w-full max-w-2xl">
			{flattenFeed.length ? (
				<div className="flex flex-col gap-4">
					{flattenFeed.map((item, index) => (
						<FeedPersonsItem
						key={index}
						item={item}
						/>
					))}
					{isFetching ? (
						<div className="flex items-center justify-center p-4">
							<Icons.loader />
						</div>
					): (
						<div ref={ref} />
					)}
				</div>
			) : (
				<div className="text-center text-muted-foreground">
				{upperFirst(t('common.messages.is_empty'))}
				</div>
			)}
		</div>
	);
}

'use client'

import { useSearchParams } from "next/navigation";
import { getValidatedQuery } from "../../_components/SearchResults";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchPersonsOptions } from "@/api/client/options/searchOptions";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { CardPerson } from "@/components/Card/CardPerson";

export const SearchCrewCast = () => {
	const t = useTranslations();
	const searchParams = useSearchParams();
	const searchQuery = getValidatedQuery(searchParams.get('q') || undefined);

	if (searchQuery && searchQuery.length > 0) {
		return <SearchResults search={searchQuery} />;
	}

	return <p className="text-muted-foreground">{upperFirst(t('common.messages.search_person'))}</p>
}

const SearchResults = ({
	search,
} : {
	search: string;
}) => {
	const t = useTranslations();
	const { ref, inView } = useInView();
	const {
		data,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(useSearchPersonsOptions({
		query: search,
	}));

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);
	return (
		<div className="flex flex-col gap-4">
			{isLoading ? (
				Array.from({ length: 16 }).map((_, index) => (
					<Skeleton key={index} className="h-20 w-full rounded-md" style={{ animationDelay: `${index * 0.12}s`}} />
				))
			) : data?.pages[0]?.pagination.total_results ? (
				data?.pages.map((page, i) => (
					page?.data.map((person, index) => (
						<CardPerson
						key={i}
						ref={(i === data.pages.length - 1) && (index === page.data.length - 1) ? ref : undefined}
						variant='row'
						person={person}
						className='border-none bg-transparent shadow-none'
						posterClassName='w-[50px]'
						/>
					))
				))
			) : (
				<p className='text-muted-foreground'>
					{t.rich('common.messages.no_results_for', {
						query: search,
						strong: (chunks) => <strong>{chunks}</strong>,
					})}
				</p>
			)}
		</div>
	);
}
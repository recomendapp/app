'use client'

import { useSearchMultiOptions } from "@/api/client/options/searchOptions"
import { useSearchParams } from "next/navigation"
import { z } from "zod";
import { FeaturedPlaylists } from "./FeaturedPlaylists";
import { MediaMovie, MediaPerson, MediaTvSeries, Playlist, Profile } from "@recomendapp/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CardMovie } from "@/components/Card/CardMovie";
import { SearchPersonsResponse, SearchMoviesResponse, SearchPlaylistsResponse, SearchTvSeriesResponse, SearchUsersResponse, BestResultItem } from "@recomendapp/api-js";
import { CardTvSeries } from "@/components/Card/CardTvSeries";
import { CardPlaylist } from "@/components/Card/CardPlaylist";
import { CardPerson } from "@/components/Card/CardPerson";
import { CardUser } from "@/components/Card/CardUser";

const querySchema = z.string().min(1);
export const getValidatedQuery = (query?: string | null): string | null => {
  const parsed = querySchema.safeParse(query);
  return parsed.success ? parsed.data : null;
};

export const Search = () => {
	const searchParams = useSearchParams();
	const searchQuery = getValidatedQuery(searchParams.get('q') || undefined);

	if (searchQuery && searchQuery.length > 0) {
		return <SearchResults search={searchQuery} />
	}

	return <FeaturedPlaylists />
};

const SearchResults = ({
	search,
} : {
	search: string;
}) => {
	const {
		data,
		isLoading,
		isError
	} = useQuery(useSearchMultiOptions({
		query: search,
	}));

	return (
		<div className='grid grid-cols-1 @2xl/search:grid-cols-2 gap-4'>
			<SearchBestResult result={data?.bestResult} />
			<SearchMovies results={data?.movies} query={search} />
			<SearchTvSeries results={data?.tv_series} query={search} />
			<SearchPlaylists results={data?.playlists} query={search} />
			<SearchPersons results={data?.persons} query={search} />
			<SearchUsers results={data?.users} query={search} />
		</div>
	);
}

const SearchBestResult = ({
	result,
	className,
}: {
	result?: BestResultItem | null;
	className?: string;
}) => {
	const t = useTranslations();
	if (result === null) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{result ? <h2 className="text-2xl font-bold">
				{upperFirst(t('common.messages.top_result'))}
			</h2> : <Skeleton className="h-8 w-32"/>}
			{result ? (
				result?.type === 'movie'
					? <CardMovie variant='row' movie={result.data as MediaMovie} className="max-w-[600px] h-80" posterClassName="h-full w-auto" />
				: result?.type === 'tv_series'
					? <CardTvSeries variant='row' tvSeries={result.data as MediaTvSeries} className="max-w-[600px] h-80" posterClassName="h-full w-auto" />
				: result?.type === 'person'
					? <CardPerson variant="row" person={result.data as MediaPerson} className="max-w-[600px] h-80" posterClassName="h-full w-auto" />
				: result?.type === 'playlist'
					? <CardPlaylist playlist={result.data as Playlist} className="max-w-[200px]" />
				: result?.type === 'user'
					? <CardUser user={result.data as Profile} className="max-w-[600px] h-40" />
				: null
			) : (
				<Skeleton className="aspect-square w-80 rounded-md" />
			)}
		</div>
	);
};

const SearchMovies = ({
	results,
	query,
	className,
} : {
	results?: SearchMoviesResponse;
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (results?.data && results.data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{results?.data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/films?q=${query}`}>
						{upperFirst(t('common.messages.film', { count: 2}))}
						<span className="text-sm ml-1 text-muted-foreground">- {results.pagination.total_results}</span>
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="flex flex-col gap-2">
			{results?.data ? results.data.slice(0, 4).map((movie, i) => (
				<CardMovie
				key={i}
				variant='row'
				movie={movie as MediaMovie}
				className='border-none bg-transparent shadow-none'
				posterClassName='w-[50px]'
				/>
			)) : (
				Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-20 w-full rounded-md" style={{ animationDelay: `${i * 0.12}s`}} />
				))
			)}
			</div>
		</div>
	)
}

const SearchTvSeries = ({
	results,
	query,
	className,
} : {
	results?: SearchTvSeriesResponse;
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (results?.data && results.data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{results?.data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/tv-series?q=${query}`}>
						{upperFirst(t('common.messages.tv_series', { count: 2}))}
						<span className="text-sm ml-1 text-muted-foreground">- {results.pagination.total_results}</span>
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="flex flex-col gap-2">
			{results?.data ? results.data.slice(0, 4).map((tvSeries, i) => (
				<CardTvSeries
				key={i}
				variant='row'
				tvSeries={tvSeries}
				className='border-none bg-transparent shadow-none'
				posterClassName='w-[50px]'
				/>
			)) : (
				Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-20 w-full rounded-md" style={{ animationDelay: `${i * 0.12}s`}} />
				))
			)}
			</div>
		</div>
	)
}

const SearchPlaylists = ({
	results,
	query,
	className,
} : {
	results?: SearchPlaylistsResponse;
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (results?.data && results.data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{results?.data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/playlists?q=${query}`}>
						{upperFirst(t('common.messages.playlist', { count: 2}))}
						<span className="text-sm ml-1 text-muted-foreground no-underline">- {results.pagination.total_results}</span>
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="grid grid-cols-2 @lg/search:grid-cols-4 gap-2 max-w-[600px]">
			{results?.data ? results.data.slice(0, 4).map((playlist, i) => (
				<CardPlaylist
				key={i}
				playlist={playlist}
				variant='default'
				className='border-none bg-transparent shadow-none'
				/>
			)) : (
				Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="w-full aspect-square rounded-md" style={{ animationDelay: `${i * 0.12}s`}} />
				))
			)}
			</div>
		</div>
	)
}

const SearchPersons = ({
	results,
	query,
	className,
} : {
	results?: SearchPersonsResponse;
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (results?.data && results.data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{results?.data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/persons?q=${query}`}>
						{upperFirst(t('common.messages.person', { count: 2}))}
						<span className="text-sm ml-1 text-muted-foreground no-underline">- {results.pagination.total_results}</span>
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="flex flex-col gap-2">
			{results?.data ? results.data.slice(0, 4).map((person, i) => (
				<CardPerson
				key={i}
				variant='row'
				person={person}
				className='border-none bg-transparent shadow-none'
				posterClassName='w-[50px]'
				/>
			)) : (
				Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-20 w-full rounded-md" style={{ animationDelay: `${i * 0.12}s`}} />
				))
			)}
			</div>
		</div>
	)
}

const SearchUsers = ({
	results,
	query,
	className,
} : {
	results?: SearchUsersResponse;
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (results?.data && results.data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{results?.data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/users?q=${query}`}>
						{upperFirst(t('common.messages.user', { count: 2}))}
						<span className="text-sm ml-1 text-muted-foreground no-underline">- {results.pagination.total_results}</span>
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="grid grid-cols-2 @lg/search:grid-cols-4 gap-2 max-w-[600px]">
			{results?.data ? results.data.slice(0, 4).map((user, i) => (
				<CardUser
				key={i}
				variant='vertical'
				user={user}
				className='border-none bg-transparent shadow-none'
				/>
			)) : (
				Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="w-full aspect-square rounded-md" style={{ animationDelay: `${i * 0.12}s`}} />
				))
			)}
			</div>
		</div>
	)
};
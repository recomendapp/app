'use client'

import { useSearchParams } from "next/navigation"
import { z } from "zod";
import { FeaturedPlaylists } from "./FeaturedPlaylists";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CardMovie } from "@/components/Card/CardMovie";
import { CardTvSeries } from "@/components/Card/CardTvSeries";
import { CardPlaylist } from "@/components/Card/CardPlaylist";
import { CardPerson } from "@/components/Card/CardPerson";
import { CardUser } from "@/components/Card/CardUser";
import { searchGlobalOptions } from "@libs/query-client";
import { MovieCompact, PersonCompact, PlaylistWithOwner, SearchBestResultItem, TvSeriesCompact, UserSummary } from "@libs/api-js";

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
	} = useQuery(searchGlobalOptions({
		filters: {
			q: search
		}
	}));

	return (
		<div className='grid grid-cols-1 @2xl/search:grid-cols-2 gap-4'>
			<SearchBestResult data={data?.best_result} />
			<SearchMovies data={data?.movies} query={search} />
			<SearchTvSeries data={data?.tv_series} query={search} />
			<SearchPlaylists data={data?.playlists} query={search} />
			<SearchPersons data={data?.persons} query={search} />
			<SearchUsers data={data?.users} query={search} />
		</div>
	);
}

const SearchBestResult = ({
	data,
	className,
}: {
	data?: SearchBestResultItem | null;
	className?: string;
}) => {
	const t = useTranslations();
	if (data === null) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{data ? <h2 className="text-2xl font-bold">
				{upperFirst(t('common.messages.top_result'))}
			</h2> : <Skeleton className="h-8 w-32"/>}
			{data ? (
				data?.type === 'movie'
					? <CardMovie variant='row' movie={data.data} className="max-w-[600px] h-80" posterClassName="h-full w-auto" />
				: data?.type === 'tv_series'
					? <CardTvSeries variant='row' tvSeries={data.data} className="max-w-[600px] h-80" posterClassName="h-full w-auto" />
				: data?.type === 'person'
					? <CardPerson variant="row" person={data.data} className="max-w-[600px] h-80" posterClassName="h-full w-auto" />
				: data?.type === 'playlist'
					? <CardPlaylist playlist={data.data} owner={data.data.owner} className="max-w-[200px]" />
				: data?.type === 'user'
					? <CardUser user={data.data} className="max-w-[600px] h-40" />
				: null
			) : (
				<Skeleton className="aspect-square w-80 rounded-md" />
			)}
		</div>
	);
};

const SearchMovies = ({
	data,
	query,
	className,
} : {
	data?: MovieCompact[];
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (data && data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/films?q=${query}`}>
						{upperFirst(t('common.messages.film', { count: 2}))}
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="flex flex-col gap-2">
			{data ? data.slice(0, 4).map((movie, i) => (
				<CardMovie
				key={i}
				variant='row'
				movie={movie}
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
	data,
	query,
	className,
} : {
	data?: TvSeriesCompact[];
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (data && data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/tv-series?q=${query}`}>
						{upperFirst(t('common.messages.tv_series', { count: 2}))}
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="flex flex-col gap-2">
			{data ? data.slice(0, 4).map((tvSeries, i) => (
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
	data,
	query,
	className,
} : {
	data?: PlaylistWithOwner[];
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (data && data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/playlists?q=${query}`}>
						{upperFirst(t('common.messages.playlist', { count: 2}))}
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="grid grid-cols-2 @lg/search:grid-cols-4 gap-2 max-w-[600px]">
			{data ? data.slice(0, 4).map(({ owner, ...playlist }, i) => (
				<CardPlaylist
				key={i}
				playlist={playlist}
				owner={owner}
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
	data,
	query,
	className,
} : {
	data?: PersonCompact[];
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (data && data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/persons?q=${query}`}>
						{upperFirst(t('common.messages.person', { count: 2}))}
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="flex flex-col gap-2">
			{data ? data.slice(0, 4).map((person, i) => (
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
	data,
	query,
	className,
} : {
	data?: UserSummary[];
	query: string;
	className?: string;
}) => {
	const t = useTranslations();
	if (data && data.length === 0) return null;
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{data ? (
				<Button
				variant={'link'}
				className="text-2xl font-bold justify-start p-0"
				asChild
				>
					<Link href={`/search/users?q=${query}`}>
						{upperFirst(t('common.messages.user', { count: 2}))}
					</Link>
				</Button>
			) : <Skeleton className="h-8 w-32"/>}
			<div className="grid grid-cols-2 @lg/search:grid-cols-4 gap-2 max-w-[600px]">
			{data ? data.slice(0, 4).map((user, i) => (
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
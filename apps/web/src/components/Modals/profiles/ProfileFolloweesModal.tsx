'use client'

import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Loader from '@/components/Loader';
import { getInitiales } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useInView } from 'react-intersection-observer';
import { Search } from 'lucide-react';
import useDebounce from '@/hooks/use-debounce';
import { Link } from "@/lib/i18n/navigation";
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useUserFolloweesOptions } from '@/api/client/options/userOptions';

export function ProfileFolloweesModal({
	userId,
} : {
	userId: string;
}) {
	const t = useTranslations();
	const [ search, setSearch ] = useState<null | string>(null);
	const debouncedSearch = useDebounce(search);
	const { ref, inView } = useInView();
	const {
		data: followees,
		isLoading: loading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useInfiniteQuery(useUserFolloweesOptions({
		userId: userId,
	}));

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, followees, fetchNextPage]);

	return (
		<>
			<div className="relative">
				<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					value={search ?? ''}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={upperFirst(t('common.messages.search_an_user'))}
					autoFocus={false}
					className="pl-8"
				/>
			</div>
			<ScrollArea className="flex flex-col gap-2 border-2 rounded-md h-[60vh]">
			{followees?.pages[0]?.length ? (
				followees?.pages.map((page, i) => (
					page?.map(({ followee }, index) => (
						<Link
							href={`/@${followee?.username}`}
							key={followee?.id}
							className='flex items-center w-full gap-2 p-2 hover:bg-muted'
							{...(i === followees.pages.length - 1 &&
								index === page.length - 1
									? { ref: ref }
									: {})}
					>
							<Avatar className="h-10 w-10 shadow-2xl">
								<AvatarImage
									src={followee?.avatar_url ?? ''}
									alt={followee?.username!}
								/>
								<AvatarFallback className="text-primary-foreground bg-muted text-[20px]">
									{getInitiales(followee?.username ?? '')}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="line-clamp-1">{followee?.full_name}</p>
								<p className="text-muted-foreground line-clamp-1">
									@{followee?.username}
								</p>
							</div>
						</Link>
					))
				))
			) : (debouncedSearch && !loading && !isFetchingNextPage) ? (
				<p className="text-center p-2">{upperFirst(t('common.messages.no_results'))}</p>
			) : followees != null ? (
				<p className="text-center p-2">{upperFirst(t('common.messages.no_followees'))}</p>
			) : (
				<></>
			)}
			{(loading || isFetchingNextPage) && <Loader />}
			</ScrollArea>
		</>
	);
}

'use client'

import { useQuery } from '@tanstack/react-query';
import { TableBookmark } from './_components/TableBookmark/TableBookmark';
import { userBookmarksAllOptions } from '@libs/query-client';
import { useAuth } from '@/context/auth-context';
import { useMemo } from 'react';
import { BookmarksHeader } from './_components/BookmarksHeader';
import { ImageObject } from '@/hooks/use-random-image';

const Bookmarks = () => {
	const { user } = useAuth();
	const {
		data,
	} = useQuery(userBookmarksAllOptions({
		userId: user?.id,
	}));
	const backdrops = useMemo(() => (
		data?.map(item => {
			if (item.type === 'movie') {
				if (item.media.backdropPath) {
				return { src: item.media.backdropPath, alt: item.media.title };
				}
			}
			if (item.type === 'tv_series') {
				if (item.media.backdropPath) {
				return { src: item.media.backdropPath, alt: item.media.name };
				}
			}
			return null;
			})
			.filter(item => item?.src !== null && item?.src !== undefined) as ImageObject[]
	), [data]);

	return (
	<>
		<BookmarksHeader
		numberItems={data ? data.length : undefined}
		backdrops={backdrops}
		/>
		{data && (
			<TableBookmark
			data={data}
			className='px-4'
			/>
		)}
	</>
	)
};

export default Bookmarks;

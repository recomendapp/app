import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Link } from "@/lib/i18n/navigation";
import { usePathname } from '@/lib/i18n/navigation';
import { Fragment, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { CardPlaylist } from '@/components/Card/CardPlaylist';
import Loader from '@/components/Loader';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useUserPlaylistsInfiniteOptions } from '@/api/client/options/userOptions';

export function UserPlaylists({
  grid = false,
}: {
  grid?: boolean;
}) {
  const { session } = useAuth();
	const pathname = usePathname();
	const { ref, inView } = useInView();

  const {
    data: playlists,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(useUserPlaylistsInfiniteOptions({
    userId: session?.user.id,
    filters: {
			sortBy: 'updated_at',
			sortOrder: 'desc',
		}
  }));
  const loading = playlists === undefined || isLoading;

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, playlists, fetchNextPage]);

  if (loading) return <Loader />;

  if (playlists?.pages[0]?.length === 0) return null;

  if (grid) {
    return (
      <Fragment>
        {playlists?.pages.map((page, i) => (
          page?.map((playlist, index) => (
            <CardPlaylist
            ref={(i === playlists.pages?.length - 1) && (index === page?.length - 1) ? ref : undefined }
            key={playlist?.id}
            playlist={playlist}
            showByUser={false}
            showItemCount={true}
            />
          ))
        ))}
      </Fragment>
    );
  }
  return (
    <Fragment>
      {playlists?.pages.map((page, i) => (
        page?.map((playlist, index) => (
          <Button
            key={playlist?.id}
            variant={
              pathname === `/playlist/${playlist?.id}` ? 'secondary' : 'ghost'
            }
            className={`justify-start p-2`}
            ref={(i === playlists.pages?.length - 1) && (index === page?.length - 1) ? ref : undefined }
            asChild
          >
            <Link
              href={'/playlist/' + playlist?.id}
              className="h-fit w-full flex gap-4"
            >
              <div className={`w-12 shadow-2xl shrink-0`}>
                <AspectRatio ratio={1 / 1}>
                  <ImageWithFallback
                  src={playlist?.poster_url ?? ''}
                  alt={playlist?.title ?? ''}
                  fill
                  className="rounded-md object-cover"
                  type="playlist"
                  />
                </AspectRatio>
              </div>
              <div>
                <p className="line-clamp-1">{playlist?.title}</p>
                <p>{playlist?.items_count} films</p>
              </div>
            </Link>
          </Button>
        ))
      ))}
    </Fragment>
  );
}

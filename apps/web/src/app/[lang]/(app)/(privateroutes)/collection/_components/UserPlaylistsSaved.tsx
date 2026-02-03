import { useAuth } from '@/context/auth-context';
import { Fragment, useEffect } from 'react';
import Loader from '@/components/Loader';
import { useInView } from 'react-intersection-observer';
import { CardPlaylist } from '@/components/Card/CardPlaylist';
import { Playlist } from '@recomendapp/types'
import { useInfiniteQuery } from '@tanstack/react-query';
import { useUserPlaylistsSavedOptions } from '@/api/client/options/userOptions';

export function UserPlaylistsSaved({
  sidebarExpanded,
  grid = false,
}: {
  sidebarExpanded: boolean;
  grid?: boolean;
}) {
  const { session } = useAuth();
	const { ref, inView } = useInView();

  const {
    data: playlists,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery(useUserPlaylistsSavedOptions({
    userId: session?.user.id,
  }));

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, playlists, fetchNextPage]);

  if (isLoading) return <Loader />;

  if (!session) return null;

  if (!isLoading && !playlists?.pages[0]?.length) return null;


  if (grid) {
    return (
      <Fragment>
        {playlists?.pages.map((page, i) => (
          page?.map(({ playlist }) => (
            <CardPlaylist playlist={playlist as Playlist} key={playlist?.id} />
          ))
        ))}
      </Fragment>
    );
  }
  return (
    <Fragment>
      {playlists?.pages.map((page, i) => (
        page?.map(({ playlist }, index) => (
          <CardPlaylist
          key={i}
          ref={(i === playlists.pages?.length - 1) && (index === page?.length - 1) ? ref : undefined }
          playlist={playlist}
          />
        ))
      ))}
    </Fragment>
  );
}

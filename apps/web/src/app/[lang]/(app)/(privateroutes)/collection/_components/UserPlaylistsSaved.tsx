import { useAuth } from '@/context/auth-context';
import { Fragment, useEffect } from 'react';
import Loader from '@/components/Loader';
import { useInView } from 'react-intersection-observer';
import { CardPlaylist } from '@/components/Card/CardPlaylist';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userPlaylistsSavedInfiniteOptions } from '@libs/query-client';

export function UserPlaylistsSaved({
  sidebarExpanded,
  grid = false,
}: {
  sidebarExpanded: boolean;
  grid?: boolean;
}) {
  const { user } = useAuth();
	const { ref, inView } = useInView();

  const {
    data: playlists,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(userPlaylistsSavedInfiniteOptions({
    userId: user?.id,
  }));
  const flattenPlaylists = playlists?.pages.flatMap(page => page.data) || [];

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, playlists, fetchNextPage]);

  if (isLoading) return <Loader />;

  if (!user) return null;

  if (!isLoading && !flattenPlaylists.length) return null;


  if (grid) {
    return (
      <Fragment>
        {flattenPlaylists?.map((playlist, index) => (
          <CardPlaylist
          key={playlist.id}
          playlist={playlist}
          ref={(index === flattenPlaylists.length - 1) ? ref : null}
          />
        ))}
      </Fragment>
    );
  }
  return (
    <Fragment>
      {flattenPlaylists?.map((playlist, index) => (
        <CardPlaylist
        key={playlist.id}
        playlist={playlist}
        ref={(index === flattenPlaylists.length - 1) ? ref : null}
        />
      ))}
    </Fragment>
  );
}

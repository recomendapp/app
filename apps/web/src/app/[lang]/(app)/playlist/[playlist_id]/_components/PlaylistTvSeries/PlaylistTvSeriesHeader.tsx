import { HeaderBox } from "@/components/Box/HeaderBox";
import { CardUser } from "@/components/Card/CardUser";
import { ContextMenuPlaylist } from "@/components/ContextMenu/ContextMenuPlaylist";
import { PlaylistModal } from "@/components/Modals/playlists/PlaylistModal";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { useRandomImage } from "@/hooks/use-random-image";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { Playlist } from "@recomendapp/types";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";

interface PlaylistTvSeriesHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
    playlist: Playlist;
    numberItems: number;
    backdrops?: string[];
    skeleton?: boolean;
}

export function PlaylistTvSeriesHeader({
  playlist,
  numberItems,
  backdrops,
  skeleton,
} : PlaylistTvSeriesHeaderProps) {
  const { session } = useAuth();
  const t = useTranslations();
  const { openModal, createModal } = useModal();
  const backdrop = useRandomImage(
    backdrops?.map(src => ({ src, alt: playlist.title })) || []
  );

  const openPlaylistModal = () => {
    if (playlist?.user_id !== session?.user.id) return;
    openModal(PlaylistModal, {
      playlist,
    })
  }

  return (
  <ContextMenuPlaylist playlist={playlist}>
    <HeaderBox background={(!skeleton && backdrop?.src) ? { src: getTmdbImage({ path: backdrop.src, size: 'w1280' }), alt: 'Likes Header Background', unoptimized: true } : undefined} className="flex-col items-center">
      <div className="flex flex-col w-full gap-4 items-center md:flex-row">
        <div
          className="w-[250px] shadow-md cursor-pointer shrink-0 aspect-square"
          onClick={() => openPlaylistModal()}
        >
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
        <div className="flex flex-col justify-between gap-2 w-full">
          {/* TYPE & GENRES */}
          <div>
            <span className='text-accent-yellow'>{upperFirst(t('common.messages.playlist', {count: 1}))}</span>
            <span className=" before:content-['_|_']">
              {playlist?.private ? upperFirst(t('common.messages.private', {gender: 'female', count: 1})) : upperFirst(t('common.messages.public'))}
            </span>
          </div>
          <div>
            <h1
              onClick={() => openPlaylistModal()}
              className="w-fit text-clamp font-bold line-clamp-2 cursor-pointer"
            >
              {playlist?.title}
            </h1>
          </div>
          <div className='space-y-2'>
            {/* DESCRIPTION */}
            <p
              className='cursor-pointer text-muted-foreground font-light line-clamp-2'
              onClick={() => createModal({
                header: {
                  title: upperFirst(t('common.messages.description')),
                },
                content: <p className='p-4 bg-muted rounded-md'>{playlist?.description}</p>
              })}
            >
              {playlist?.description}
            </p>
            {/* ITEMS */}
            <div className="flex gap-1 font-light">
              {playlist.user ? <CardUser user={playlist?.user} variant='inline' /> : null}
              <span className=" before:content-['_•_']" >
                {`${numberItems} ${t('common.messages.tv_series', { count: numberItems })}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </HeaderBox>
  </ContextMenuPlaylist>
  )
}

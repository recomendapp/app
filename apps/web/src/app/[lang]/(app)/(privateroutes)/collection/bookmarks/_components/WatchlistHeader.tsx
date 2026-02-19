import { HeaderBox } from "@/components/Box/HeaderBox";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageObject, useRandomImage } from "@/hooks/use-random-image";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookmarkTab, useUIStore } from "@/stores/useUIStore";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface WatchlistHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
    skeleton?: boolean;
    tab: BookmarkTab;
    numberItems: number | undefined;
    backdrops?: ImageObject[];
}

export function WatchlistHeader({
  numberItems,
  tab,
  backdrops,
  skeleton,
} : WatchlistHeaderProps) {
  const t = useTranslations();
  const setTab = useUIStore((state) => state.setBookmarkTab);
  const backdrop = useRandomImage(backdrops || []);

  return (
    <HeaderBox background={!skeleton ? { src: (backdrop?.src ? getTmdbImage({ path: backdrop.src, size: 'w1280' }) : 'https://media.giphy.com/media/Ic0IOSkS23UAw/giphy.gif'), alt: 'Likes Header Background', unoptimized: true } : undefined} className="flex-col items-center">
      <div className="w-full h-full flex flex-col justify-center items-center text-center px-4 py-8 gap-2">
        <h2 className="text-6xl font-bold text-accent-yellow">
          {upperFirst(t('common.messages.watchlist', { count: 2 }))}
        </h2>
        {!skeleton ? (
          <ItemCount count={numberItems} tab={tab} />
        ) : <Skeleton className="h-6 w-24" />}
      </div>
      <Tabs defaultValue={tab} onValueChange={(value) => setTab(value as BookmarkTab)}>
        <TabsList>
          <TabsTrigger value="all">{upperFirst(t('common.messages.all'))}</TabsTrigger>
          <TabsTrigger value="movie">{upperFirst(t('common.messages.film', { count: 2 }))}</TabsTrigger>
          <TabsTrigger value="tv_series">{upperFirst(t('common.messages.tv_series', { count: 2 }))}</TabsTrigger>
        </TabsList>
      </Tabs>
    </HeaderBox>
  )
}

const ItemCount = ({ count, tab }: { count?: number; tab: BookmarkTab }) => {
  const t = useTranslations();

  const getItemCountLabel = (count: number) => {
    switch (tab) {
      case 'movie':
        return t('common.messages.film_count', { count });
      case 'tv_series':
        return t('common.messages.tv_series_count', { count });
      default:
        return t('common.messages.item_count', { count });
    }
  };

  if (count === undefined) return null;

  return (
    <p className="text-muted-foreground">
      {getItemCountLabel(count)}
    </p>
  );
};

import { HeaderBox } from "@/components/Box/HeaderBox";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageObject, useRandomImage } from "@/hooks/use-random-image";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { BookmarkTab } from "@/stores/useUIStore";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface BookmarksHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
    skeleton?: boolean;
    numberItems: number | undefined;
    backdrops: ImageObject[];
}

export function BookmarksHeader({
  numberItems,
  backdrops,
  skeleton,
} : BookmarksHeaderProps) {
  const t = useTranslations();
  const backdrop = useRandomImage(backdrops || []);

  return (
    <HeaderBox background={!skeleton && backdrop ? { src: getTmdbImage({ path: backdrop.src, size: 'w1280' }), alt: 'Likes Header Background', unoptimized: true } : undefined} className="flex-col items-center">
      <div className="w-full h-full flex flex-col justify-center items-center text-center px-4 py-8 gap-2">
        <h2 className="text-6xl font-bold text-accent-yellow">
          {upperFirst(t('common.messages.for_later'))}
        </h2>
        {numberItems !== undefined ? (
          <ItemCount count={numberItems} tab={'all'} />
        ) : <Skeleton className="h-6 w-24" />}
      </div>
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

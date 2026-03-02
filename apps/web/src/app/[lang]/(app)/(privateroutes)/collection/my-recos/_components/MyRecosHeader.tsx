import { HeaderBox } from "@/components/Box/HeaderBox";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageObject, useRandomImage } from "@/hooks/use-random-image";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";

interface MyRecosHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
    skeleton?: boolean;
    numberItems: number | undefined;
    backdrops: ImageObject[];
}

export function MyRecosHeader({
  numberItems,
  backdrops,
  skeleton,
} : MyRecosHeaderProps) {
  const t = useTranslations();
  const backdrop = useRandomImage(backdrops || []);

  return (
    <HeaderBox background={!skeleton && backdrop ? { src: getTmdbImage({ path: backdrop.src, size: 'w1280' }), alt: 'Likes Header Background', unoptimized: true } : undefined} className="flex-col items-center">
      <div className="w-full h-full flex flex-col justify-center items-center text-center px-4 py-8 gap-2">
        <h2 className="text-6xl font-bold text-accent-yellow">
          {upperFirst(t('common.messages.my_recos', { count: 2 }))}
        </h2>
        {numberItems !== undefined ? (
          <p className="text-muted-foreground">
            {t('common.messages.item_count', { count: numberItems })}
          </p>
        ) : <Skeleton className="h-6 w-24" />}
      </div>
    </HeaderBox>
  )
}

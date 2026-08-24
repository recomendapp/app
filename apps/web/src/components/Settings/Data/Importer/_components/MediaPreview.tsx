'use client';

import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { DateOnlyYearTooltip } from '@/components/utils/Date';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

export function MediaPreview({
  title,
  posterPath,
  date,
  rawTitle,
  rawYear,
}: {
  title?: string | null;
  posterPath?: string | null;
  date?: string | null;
  rawTitle: string;
  rawYear?: number | null;
}) {
  const t = useTranslations();

  if (!title) {
    return (
      <div className="flex gap-3 items-center overflow-hidden">
        <div className="relative w-[45px] aspect-2/3 shrink-0 rounded-md overflow-hidden">
          <ImageWithFallback src={null} alt={rawTitle} fill className="object-cover" unoptimized />
        </div>
        <div className="flex flex-col gap-1 overflow-hidden">
          <span className="font-medium truncate">{rawTitle}</span>
          <span className="text-sm text-muted-foreground">{rawYear ?? '—'}</span>
          <Badge variant="destructive" className="w-fit">
            {t('pages.settings.data.importer.no_match')}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-center overflow-hidden">
      <div className="relative w-[45px] aspect-2/3 shrink-0 rounded-md overflow-hidden">
        <ImageWithFallback
          src={getTmdbImage({ path: posterPath, size: 'w185' })}
          alt={title}
          fill
          className="object-cover"
          type="movie"
          unoptimized
        />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="font-medium truncate">{title}</span>
        {date && (
          <span className="text-sm text-muted-foreground">
            <DateOnlyYearTooltip date={date} />
          </span>
        )}
      </div>
    </div>
  );
}

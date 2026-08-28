'use client';

import { ImportJobLogMovie, ImportJobLogTvSeries } from '@libs/api-js';
import {
  useImportPatchLogMovieReviewMutation,
  useImportPatchLogTvSeriesReviewMutation,
} from '@libs/query-client';
import { Button } from '@libs/ui/components/button';
import { Badge } from '@libs/ui/components/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@libs/ui/components/card';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Icons } from '@/config/icons';
import { MessageSquareTextIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

type Props = (
  | { jobId: number; type: 'movie'; item: ImportJobLogMovie }
  | { jobId: number; type: 'tv_series'; item: ImportJobLogTvSeries }
) & {
  hasExistingReview: boolean;
};

export function ReviewInlineReview(props: Props) {
  const t = useTranslations();
  const patchMovieReview = useImportPatchLogMovieReviewMutation();
  const patchTvSeriesReview = useImportPatchLogTvSeriesReviewMutation();
  const review = props.item.review;
  if (!review) return null;

  const resolution =
    review.resolution ?? (props.hasExistingReview ? 'keep_existing' : 'use_imported');

  const setResolution = (value: 'keep_existing' | 'use_imported') => {
    if (props.type === 'movie') {
      patchMovieReview.mutate({
        path: { id: props.jobId, itemId: props.item.id },
        body: { resolution: value },
      });
    } else {
      patchTvSeriesReview.mutate({
        path: { id: props.jobId, itemId: props.item.id },
        body: { resolution: value },
      });
    }
  };

  return (
    <Card className="gap-2">
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <MessageSquareTextIcon size={14} className="text-muted-foreground" />
          {upperFirst(t('common.messages.review', { count: 1 }))}
        </CardTitle>
        {props.hasExistingReview && (
          <Badge variant="accent-yellow" className="w-fit">
            {t('pages.settings.data.importer.conflict')}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className={resolution === 'keep_existing' ? 'opacity-50' : undefined}>
          {review.title && <p className="text-sm font-medium">{review.title}</p>}
          <p className="text-sm text-muted-foreground line-clamp-3">{review.body}</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <TooltipBox tooltip={t('pages.settings.data.importer.keep_existing')}>
          <Button
            size="icon"
            variant={resolution === 'keep_existing' ? 'default' : 'outline'}
            onClick={() => setResolution('keep_existing')}
          >
            <Icons.X className="size-4" />
          </Button>
        </TooltipBox>
        <TooltipBox tooltip={t('pages.settings.data.importer.use_imported')}>
          <Button
            size="icon"
            variant={resolution === 'use_imported' ? 'default' : 'outline'}
            onClick={() => setResolution('use_imported')}
          >
            <Icons.check className="size-4" />
          </Button>
        </TooltipBox>
      </CardFooter>
    </Card>
  );
}

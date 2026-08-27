'use client';

import { Button } from '@libs/ui/components/button';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Icons } from '@/config/icons';
import { GitMergeIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Resolution = 'keep_existing' | 'use_imported' | 'merge';

export function ReviewInlineConflict({
  resolution,
  onResolutionChange,
}: {
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex gap-1">
      <TooltipBox tooltip={t('pages.settings.data.importer.keep_existing')}>
        <Button
          size="icon"
          variant={resolution === 'keep_existing' ? 'default' : 'outline'}
          onClick={() => onResolutionChange('keep_existing')}
        >
          <Icons.X className="size-4" />
        </Button>
      </TooltipBox>
      <TooltipBox tooltip={t('pages.settings.data.importer.use_imported')}>
        <Button
          size="icon"
          variant={resolution === 'use_imported' ? 'default' : 'outline'}
          onClick={() => onResolutionChange('use_imported')}
        >
          <Icons.check className="size-4" />
        </Button>
      </TooltipBox>
      <TooltipBox tooltip={t('pages.settings.data.importer.merge')}>
        <Button
          size="icon"
          variant={resolution === 'merge' ? 'default' : 'outline'}
          onClick={() => onResolutionChange('merge')}
        >
          <GitMergeIcon size={15} />
        </Button>
      </TooltipBox>
    </div>
  );
}

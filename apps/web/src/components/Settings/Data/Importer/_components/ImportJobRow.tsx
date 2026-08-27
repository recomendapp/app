'use client';

import { ImportJob } from '@libs/api-js';
import { useImportDeleteMutation } from '@libs/query-client';
import { Badge, badgeVariants } from '@libs/ui/components/badge';
import { Button } from '@libs/ui/components/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@libs/ui/components/alert-dialog';
import { Loader2Icon, TrashIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { VariantProps } from 'class-variance-authority';

const STATUS_VARIANT: Record<
  ImportJob['status'],
  NonNullable<VariantProps<typeof badgeVariants>['variant']>
> = {
  pending: 'secondary',
  processing: 'secondary',
  awaiting_review: 'accent-yellow',
  completed: 'default',
  failed: 'destructive',
};

export function ImportJobRow({ job, onOpen }: { job: ImportJob; onOpen: () => void }) {
  const t = useTranslations();
  const format = useFormatter();
  const deleteMutation = useImportDeleteMutation();

  return (
    <div
      onClick={onOpen}
      className="flex items-center justify-between bg-muted rounded-md p-3 cursor-pointer hover:bg-muted-hover transition-colors"
    >
      <div className="flex items-center gap-2">
        {(job.status === 'pending' || job.status === 'processing') && (
          <Loader2Icon size={14} className="animate-spin text-muted-foreground shrink-0" />
        )}
        <div className="flex flex-col">
          <span className="font-medium capitalize">{job.provider}</span>
          <span className="text-xs text-muted-foreground">
            {format.relativeTime(new Date(job.createdAt), new Date())}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANT[job.status]}>
          {t(`pages.settings.data.importer.status.${job.status}`)}
        </Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <TrashIcon size={15} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.messages.are_u_sure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('pages.settings.data.importer.delete_confirm_description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.messages.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate({ id: job.id })}>
                {t('common.messages.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

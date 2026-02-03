import { useFormatter } from 'next-intl';
import { cn } from '@/lib/utils';
import { TooltipBox } from '../Box/TooltipBox';

export function DateOnlyYearTooltip({
  date,
  className,
}: {
  date: string | null | undefined;
  className?: string;
}) {
  const format = useFormatter();
  if (!date) return;

  return (
    <TooltipBox tooltip={date
        ? format.dateTime(new Date(date), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'Unknown'
    }>
      <span className={cn('w-fit cursor-pointer', className)}>{date.split('-')[0]}</span>
    </TooltipBox>
  )
}

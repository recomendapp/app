import { useFormatter } from 'next-intl';
import { cn } from '@/lib/utils';
import { TooltipBox } from '../Box/TooltipBox';

interface DateOnlyYearTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  date: string | null | undefined;
}

export function DateOnlyYearTooltip({
  date,
  children,
  className,
}: DateOnlyYearTooltipProps) {
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
      <span className={cn('w-fit cursor-pointer', className)}>
        {children || date.split('-')[0]}
      </span>
    </TooltipBox>
  )
}

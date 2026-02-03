"use client";

import { useMemo } from 'react';
import { addMinutes } from 'date-fns';
import { useFormatter, useNow } from 'next-intl';
import { ConvertHoursMinutes, cn } from '@/lib/utils';
import { TooltipBox } from '../Box/TooltipBox';

export function RuntimeTooltip({
  runtime,
  className,
}: {
  runtime: number;
  className?: string;
}) {
  const format = useFormatter();
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = useNow({ updateInterval: 1000 * 60 });
  const endTime = useMemo(() => {
    if (!runtime) return null;
    return addMinutes(now, runtime);
  }, [runtime, now]);
  const formattedEndTime = useMemo(() => {
    if (!endTime) return null;
    return format.dateTime(endTime, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: userTimeZone,
    });
  }, [endTime, format, userTimeZone]);
  if (!runtime) return null;
  return (
    <TooltipBox tooltip={`Se termine à ${formattedEndTime}`}>
      <span className={cn('w-fit cursor-pointer', className)}>
        {ConvertHoursMinutes(runtime)}
      </span>
    </TooltipBox>
  );
}
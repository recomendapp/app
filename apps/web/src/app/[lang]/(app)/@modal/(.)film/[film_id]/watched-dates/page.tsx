'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalLogMovieWatchedDates } from '@/components/Modals/logs/ModalLogMovieWatchedDates';
import { movieWatchedDatesRouteParamsSchema } from '@/app/[lang]/(app)/film/[film_id]/watched-dates/schema';

export default function InterceptedMovieWatchedDatesModal() {
  const router = useRouter();
  const rawParams = useParams<{ film_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = movieWatchedDatesRouteParamsSchema.safeParse(rawParams);

  useEffect(() => {
    if (!parsedParams.success) {
      router.back();
    }
  }, [parsedParams.success]);

  if (!parsedParams.success) {
    return null;
  }

  return (
    <ModalLogMovieWatchedDates
      movieId={parsedParams.data.film_id}
      open={open}
      onOpenChange={setOpen}
      onCloseEnd={() => router.back()}
    />
  );
}

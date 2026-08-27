'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalLogMovieWatchedDates } from '@/components/Modals/logs/ModalLogMovieWatchedDates';
import { movieWatchedDatesRouteParamsSchema } from './schema';
import Home from '../../../page';

export default function MovieWatchedDatesPage() {
  const router = useRouter();
  const rawParams = useParams<{ film_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = movieWatchedDatesRouteParamsSchema.safeParse(rawParams);

  if (!parsedParams.success) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Home />
      <ModalLogMovieWatchedDates
        movieId={parsedParams.data.film_id}
        open={open}
        onOpenChange={setOpen}
        onCloseEnd={() => router.push('/')}
      />
    </>
  );
}

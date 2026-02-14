import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getMovie } from '@/api/server/medias';
import { MovieHeader } from './_components/MovieHeader';
import { MovieNavbar } from './_components/MovieNavbar';
import { SupportedLocale } from '@libs/i18n';

export default async function Layout(
  props: {
      children: React.ReactNode;
      params: Promise<{
        lang: SupportedLocale;
        film_id: string;
      }>;
  }
) {
  const params = await props.params;

  const {
      children
  } = props;
  const { id: movieId } = getIdFromSlug(params.film_id);

  const { data: movie, error } = await getMovie(params.lang, movieId);
  if (error || !movie) {
    return notFound();
  }
  return (
  <>
    <MovieHeader movie={movie} />
      {movie && (
      <div className="px-4 pb-4 flex flex-col items-center">
        <div className='max-w-7xl w-full'>
        <MovieNavbar movieSlug={movie.slug || movie.id.toString()} />
        {children}
        </div>
      </div>
      )}
  </>
  );
};

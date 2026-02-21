import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getTranslations } from 'next-intl/server';
import { truncate } from 'lodash';
import { Pagination } from './_components/Pagination';
import { Filters } from './_components/Filters';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { ActiveFilters } from './_components/ActiveFilters';
import { getValidatedDisplay, getValidateDepartment, getValidatedSortBy, getValidatedSortOrder, getValidateJob, getValidatePage } from './_components/constants';
import { SupportedLocale } from '@libs/i18n';
import { getPerson, getPersonFilmsFacets, getPersonFilms } from '@/api/server/medias';
import { redirect } from '@/lib/i18n/navigation';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { CardMovie } from '@/components/Card/CardMovie';

export async function generateMetadata(
	props: {
		params: Promise<{
			lang: SupportedLocale;
			person_id: string;
		}>;
	}
): Promise<Metadata> {
	const { lang, person_id } = await props.params;
	const t = await getTranslations({ locale: lang });
	const { id } = getIdFromSlug(person_id);
	const person = await getPerson(lang, id);
	return {
		title: t('pages.person.films.metadata.title', { name: person.name! }),
		description: truncate(t('pages.person.films.metadata.description', { name: person.name! }), { length: siteConfig.seo.description.limit }),
		alternates: generateAlternates(lang, `/person/${person.slug}/films`),
		openGraph: {
		siteName: siteConfig.name,
		title: `${t('pages.person.films.metadata.title', { name: person.name! })} • ${siteConfig.name}`,
		description: truncate(t('pages.person.films.metadata.description', { name: person.name! }), { length: siteConfig.seo.description.limit }),
		url: `${siteConfig.url}/${lang}/person/${person.slug}/films`,
		images: person.profilePath ? [
			{ url: getTmdbImage({ path: person.profilePath, size: 'w500'}) },
		] : undefined,
		type: 'profile',
		locale: lang,
		}
	};
}

export default async function PersonFilmsPage(
	props: {
		params: Promise<{
			lang: SupportedLocale;
			person_id: string;
		}>;
		searchParams: Promise<{
			sort_by?: string;
			sort_order?: string;
			page?: number;
			per_page?: number;
			display?: string;
			department?: string;
			job?: string;
		}>;
	}
) {
	const { lang, person_id } = await props.params;
	const { id } = getIdFromSlug(person_id);
	const searchParams = await props.searchParams;
	const [
		facets,
		person,
	] = await Promise.all([
		getPersonFilmsFacets(id),
		getPerson(lang, id),
	]);
	const sortBy = getValidatedSortBy(searchParams.sort_by);
	const sortOrder = getValidatedSortOrder(searchParams.sort_order);
	const page = getValidatePage(Number(searchParams.page));
	const display = getValidatedDisplay(searchParams.display);
	const department = getValidateDepartment(facets.departments.map(d => d.department), searchParams.department);
	const job = getValidateJob(facets.departments, department, searchParams.job);
	const movies = await getPersonFilms(
		id,
		{
			page: page,
			sort_by: sortBy,
			sort_order: sortOrder,
			department: department,
			job: job,
		}
	);

	if (page > movies.meta.total_pages) {
		return redirect({ href: `/person/${person_id}/films`, locale: lang });
	}

	return (
		<div className='flex flex-col items-center'>
			<div className='@container/person-films flex flex-col gap-4 max-w-7xl w-full'>
				<div className='space-y-2'>
					<div className='flex flex-col @3xl/person-films:flex-row @3xl/person-films:justify-between items-center gap-2'>
						<Filters
						knownForDepartment={person.knownForDepartment}
						departments={facets.departments}
						sortBy={sortBy}
						sortOrder={sortOrder}
						display={display}
						department={department}
						job={job}
						/>
						<Pagination
						page={page}
						perPage={movies.meta.per_page}
						total={movies.meta.total_results}
						searchParams={new URLSearchParams(searchParams as Record<string, string>)}
						className='@md/person-films:mx-0 @md/person-films:w-fit'
						/>
					</div>
					<ActiveFilters
					department={department}
					job={job}
					/>
				</div>
				<div
				className={` gap-2
					${
						display == 'row'
						? 'flex flex-col'
						: 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 2xl:grid-cols-10'
					}
				`}
				>
					{movies.data.map(({ movie }, index) => (
						<CardMovie
						key={index}
						variant={display === 'grid' ? 'poster' : 'row'}
						movie={movie}
						className='w-full'
						/>
					))}
				</div>
				<Pagination
				page={page}
				perPage={movies.meta.per_page}
				total={movies.meta.total_results}
				searchParams={new URLSearchParams(searchParams as Record<string, string>)}
				/>
			</div>
		</div>
	)
}
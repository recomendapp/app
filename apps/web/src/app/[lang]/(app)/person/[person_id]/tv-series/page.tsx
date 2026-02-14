import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DEFAULT_PER_PAGE, getValidatedDisplay, getValidateDepartment, getValidatedSortBy, getValidatedSortOrder, getValidateJob, getValidatePage } from './_components/constants';
import { SupportedLocale } from '@libs/i18n';
import { Filters } from './_components/Filters';
import { Pagination } from './_components/Pagination';
import { ActiveFilters } from './_components/ActiveFilters';
import { getPerson, getPersonTvSeriesPagination } from '@/api/server/medias';
import { redirect } from '@/lib/i18n/navigation';
import { PersonTvSeries } from './_components/PersonTvSeries';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';

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
	const { data: person, error } = await getPerson(lang, id);
	if (error || !person) {
		return { title: upperFirst(t('common.messages.person_not_found')) };
	}
	return {
	title: t('pages.person.tv_series.metadata.title', { name: person.name! }),
	description: truncate(t('pages.person.tv_series.metadata.description', { name: person.name! }), { length: siteConfig.seo.description.limit }),
	alternates: generateAlternates(lang, `/person/${person.slug}/tv-series`),
	openGraph: {
		siteName: siteConfig.name,
		title: `${t('pages.person.tv_series.metadata.title', { name: person.name! })} • ${siteConfig.name}`,
		description: truncate(t('pages.person.tv_series.metadata.description', { name: person.name! }), { length: siteConfig.seo.description.limit }),
		url: `${siteConfig.url}/${lang}/person/${person.slug}/tv-series`,
		images: person.profilePath ? [
			{ url: getTmdbImage({ path: person.profilePath, size: 'w500'}) },
		] : undefined,
		type: 'profile',
		locale: lang,
	}
	};
}

export default async function TvSeriesPage(
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
	const { data: person, error } = await getPerson(lang, id);
	if (error || !person) {
		return notFound();
	}
	const searchParams = await props.searchParams;
	const sortBy = getValidatedSortBy(searchParams.sort_by);
	const sortOrder = getValidatedSortOrder(searchParams.sort_order);
	const page = getValidatePage(Number(searchParams.page));
	const display = getValidatedDisplay(searchParams.display);
	const department = getValidateDepartment(person.media_person_jobs, searchParams.department);
		const job = getValidateJob(person.media_person_jobs, department, searchParams.job);
	const pagination = await getPersonTvSeriesPagination(
		id,
		{
			page: page,
			perPage: DEFAULT_PER_PAGE,
			department: department,
			job: job,
		}
	);

	if (page > pagination.totalPages) {
		return redirect({ href: `/person/${person.slug || person.id}/tv-series`, locale: params.lang });
	}

	return (
	<div className='flex flex-col items-center'>
		<div className='@container/person-films flex flex-col gap-4 max-w-7xl w-full'>
			<div className='space-y-2'>
				<div className='flex flex-col @3xl/person-films:flex-row @3xl/person-films:justify-between items-center gap-2'>
					<Filters
					knownForDepartment={person.knownForDepartment}
					jobs={person.media_person_jobs}
					sortBy={sortBy}
					sortOrder={sortOrder}
					display={display}
					department={department}
					job={job}
					/>
					<Pagination
					page={page}
					perPage={pagination.perPage}
					total={pagination.totalResults ?? 0}
					searchParams={new URLSearchParams(searchParams as Record<string, string>)}
					className='@md/person-tv-series:mx-0 @md/person-tv-series:w-fit'
					/>
				</div>
				<ActiveFilters
				department={department}
				job={job}
				/>
			</div>
			<PersonTvSeries
			personId={person.id}
			display={display}
			filters={{
				page: page,
				perPage: pagination.perPage,
				sortBy: sortBy,
				sortOrder: sortOrder,
				department: department,
				job: job,
			}}
			/>
			<Pagination
			page={page}
			perPage={pagination.perPage}
			total={pagination.totalResults}
			searchParams={new URLSearchParams(searchParams as Record<string, string>)}
			/>
		</div>
	</div>
	)
}
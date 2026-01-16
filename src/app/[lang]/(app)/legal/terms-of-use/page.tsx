import { siteConfig } from "@/config/site";
import { Link } from "@/lib/i18n/navigation";
import { SupportedLocale } from "@/translations/locales";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: string;
    }>;
    }
): Promise<Metadata> {
	const params = await props.params;
	const t = await getTranslations({ locale: params.lang as SupportedLocale });
	return {
		title: t('pages.legal.terms_of_use.metadata.title'),
		description: t('pages.legal.terms_of_use.metadata.description', { app: siteConfig.name }),
	};
};

const TermsOfUsePage = async () => {
	const t = await getTranslations('pages.legal.terms_of_use');

	const data = [
		{
			section: 'intro',
			content: t('sections.intro', { app: siteConfig.name })
		},
		{
			section: 'presentation',
			title: t('sections.presentation.label'),
			content: t('sections.presentation.content', { app: siteConfig.name })
		},
		{
			section: 'account',
			title: t('sections.account.label'),
			content: t.rich('sections.account.content', {
				app: siteConfig.name,
				email: (chunks) => (
					<Link
					href="mailto:help@recomend.app"
					className="underline underline-offset-2 hover:text-accent-pink"
					>
					help@recomend.app
					</Link>
				),
			})
		},
		{
			section: 'conduct',
			title: t('sections.conduct.label'),
			content: t('sections.conduct.content')
		},
		{
			section: 'intellectual_property',
			title: t('sections.intellectual_property.label'),
			content: t('sections.intellectual_property.content', {
				app: siteConfig.name
			})
		},
		{
			section: 'privacy',
			title: t('sections.privacy.label'),
			content: t.rich('sections.privacy.content', {
				app: siteConfig.name,
				email: (chunks) => (
					<Link
					href="mailto:help@recomend.app"
					className="underline underline-offset-2 hover:text-accent-pink"
					>
					help@recomend.app
					</Link>
				),
			})
		},
		{
			section: 'cookies',
			title: t('sections.cookies.label'),
			content: t('sections.cookies.content', {
				app: siteConfig.name
			})
		},
		{
			section: 'ads',
			title: t('sections.ads.label'),
			content: t('sections.ads.content')
		},
		{
			section: 'liability',
			title: t('sections.liability.label'),
			content: t('sections.liability.content', {
				app: siteConfig.name
			})
		},
		{
			section: 'law',
			title: t('sections.law.label'),
			content: t('sections.law.content')
		}
	];
	return (
	<div className="flex flex-col gap-4 items-center text-justify transition-all">
		{data.map((section) => (
			<section key={section.section} id={section.section} className="w-full flex flex-col gap-4 px-4 max-w-xl">
				{section.title && (
					<h2 className="text-center font-semibold text-3xl text-accent-yellow">
						{section.title}
					</h2>
				)}
				<p>{section.content}</p>
			</section>
		))}
	</div>
	);
};

export default TermsOfUsePage;
import { siteConfig } from "@/config/site";
import { Link } from "@/lib/i18n/navigation";
import { SupportedLocale } from "@libs/i18n";
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
		title: t('pages.legal.privacy_policy.metadata.title'),
		description: t('pages.legal.privacy_policy.metadata.description', { app: siteConfig.name }),
	};
};

const PrivacyPolicyPage = async () => {
	const t = await getTranslations('pages.legal.privacy_policy');
	
	const data = [
		{
			section: 'intro',
			content: t('sections.intro', { app: siteConfig.name })
		},
		{
			section: 'controller',
			title: t('sections.controller.label'),
			content: t.rich('sections.controller.content', {
				email: (chunks) => (
					<Link
					href="mailto:hello@recomend.app"
					className="underline underline-offset-2 hover:text-accent-pink"
					>
					hello@recomend.app
					</Link>
				)
			})
		},
		{
			section: 'collected_data',
			title: t('sections.collected_data.label'),
			content: t('sections.collected_data.content')
		},
		{
			section: 'purpose',
			title: t('sections.purpose.label'),
			content: t('sections.purpose.content')
		},
		{
			section: 'sharing',
			title: t('sections.sharing.label'),
			content: t('sections.sharing.content')
		},
		{
			section: 'retention',
			title: t('sections.retention.label'),
			content: t('sections.retention.content')
		},
		{
			section: 'rights',
			title: t('sections.rights.label'),
			content: t.rich('sections.rights.content', {
				email: (chunks) => (
					<Link
					href="mailto:hello@recomend.app"
					className="underline underline-offset-2 hover:text-accent-pink"
					>
					hello@recomend.app
					</Link>
				)
			})
		},
		{
			section: 'cookies',
			title: t('sections.cookies.label'),
			content: t('sections.cookies.content', {
				app: siteConfig.name
			})
		},
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

export default PrivacyPolicyPage;
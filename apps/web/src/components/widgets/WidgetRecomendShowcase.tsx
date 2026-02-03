import { cn } from "@/lib/utils"
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { siteConfig } from "@/config/site";
import { useTranslations } from "next-intl";

export const WidgetRecomendShowcase = ({
	className,
} : React.HTMLAttributes<HTMLDivElement>) => {
	const t = useTranslations();
	if (!siteConfig.features.length) return null;
	return (
		<div className={cn('@container/widget-recomend-showcase space-y-4', className)}>
			<h2 className="text-xl font-semibold">
				{t.rich('common.messages.what_is_title', {
					title: siteConfig.name,
					strong: (chunks) => <strong className="text-accent-yellow">{chunks}</strong>,
				})}
			</h2>
			<div
			className={`grid grid-cols-1 gap-4
				${siteConfig.features.length % 2 === 0 ? "@2xl/widget-recomend-showcase:grid-cols-2" : "@2xl/widget-recomend-showcase:grid-cols-1"}
				${siteConfig.features.length % 4 === 0 ? "@4xl/widget-recomend-showcase:grid-cols-4" : "@4xl/widget-recomend-showcase:grid-cols-3"}
			`}
			>
			{siteConfig.features.map((feature, index) => (
				<Card key={index}>
					<CardHeader>
						<CardTitle className="flex gap-2 items-center text-xl">
							<feature.icon className={cn("w-4 text-accent-yellow", feature.iconClass)} />
							{t(`pages.showcase.features.${feature.key}.label`)}
						</CardTitle>
						<CardDescription className="ml-6">{t(`pages.showcase.features.${feature.key}.description`)}</CardDescription>
					</CardHeader>
				</Card>
			))}
			</div>
		</div>
	);
};
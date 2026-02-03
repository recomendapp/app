"use client"
import * as React from 'react'
import { Icons } from "@/config/icons"
import { cn } from "@/lib/utils"
import { upperFirst } from "lodash"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/lib/i18n/navigation"
import { ImageWithFallback } from "../utils/ImageWithFallback"
import { useModal } from "@/context/modal-context"

export function JustWatchWidget({
	id,
	idType = 'tmdb',
	title,
	year,
	theme = 'dark',
	type = 'movie',
	maxOffer = 4,
	className,
} : {
	id: number,
	idType?: string,
	title?: string
	year?: number,
	theme?: string,
	type?: string
	maxOffer?: number,
	className?: string,
}) {
	const { createModal } = useModal();
	const locale = useLocale();
	const common = useTranslations('common');

	const loadJustWatchScript = React.useCallback(() => {
		// Check if the script is already present
		if (!document.getElementById(`justwatch-widget-${id}`)) {
			const script = document.createElement("script");
			script.setAttribute("src", "https://widget.justwatch.com/justwatch_widget.js");
			script.setAttribute("async", "true");
			script.setAttribute("id", `justwatch-widget-${id}`);
			document.body.appendChild(script);
		}
	}, [id]);

	const resetAndReloadWidget = React.useCallback(() => {
		// Reset the JustWatch variable
		// @ts-ignore
		if (typeof window !== "undefined" && window["JustWatch"]) {
			// @ts-ignore
			delete window["JustWatch"];
		}

		const previousScript = document.getElementById(`justwatch-widget-${id}`);
		if (previousScript) {
			previousScript.remove();
		}

		// Reload the script
		loadJustWatchScript();
	}, [id, loadJustWatchScript]);

	React.useEffect(() => { 
		resetAndReloadWidget();

		return () => {
			// @ts-ignore
			delete window['JustWatch'];
			const script = document.getElementById(`justwatch-widget-${id}`);
			if (script)
				script.remove();
		}
	},[id, resetAndReloadWidget]);

	return (
		<div className={cn('overflow-hidden relative', className)}>
			<div
				className="clickable group text-lg font-medium"
				onClick={() => {
					createModal({
						header:  {
							title: upperFirst(common('messages.watch_film_title', { title: title! })),
							description: common.rich('messages.watch_film_streaming_or_download', {
								title: title!,
								important: (chunk) => <b>{chunk}</b>,
							}),
						},
						content: <>
							<div data-jw-widget
								data-api-key={process.env.NEXT_PUBLIC_JUSTWATCH_API_KEY}
								data-object-type={type}
								data-id={id}
								data-id-type={idType}
								data-theme={'light'}
								data-language={locale}
								data-scale="0.8"
							/>
							<div className="text-right">
								<span className="text-sm text-muted-foreground">Powered by{' '}</span>
								<Link
									href={`https://www.justwatch.com/`}
									target="_blank"
									className="inline-flex items-center gap-1"
								>
									<ImageWithFallback
										alt="JustWatch"
										height={11}
										width={70}
										src="https://widget.justwatch.com/assets/JW_logo_color_10px.svg"
									/>
								</Link>
							</div>
						</>
					});
					resetAndReloadWidget();
				}}
			>
				{type === 'movie'
					? upperFirst(common('messages.see_film'))
					: type === 'show'
					? upperFirst(common('messages.see_tv_series'))
					: type === 'season'}
				<Icons.eye size={15} className="inline-block ml-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
			</div>
			<div>
				<div data-jw-widget
					data-api-key={process.env.NEXT_PUBLIC_JUSTWATCH_API_KEY}
					data-object-type={type}
					data-id={id}
					data-id-type={idType}
					data-max-offers={maxOffer}
					data-theme={'light'}
					data-language={locale}
					data-scale="0.8"
				/>
				<div className="text-right">
					<span className="text-sm text-muted-foreground">Powered by{' '}</span>
					<Link
						href={`https://www.justwatch.com/`}
						target="_blank"
						className="inline-flex items-center gap-1"
					>
						<ImageWithFallback
							alt="JustWatch"
							height={11}
							width={70}
							src="https://widget.justwatch.com/assets/JW_logo_color_10px.svg"
						/>
					</Link>
				</div>
				{/* <script async src="https://widget.justwatch.com/justwatch_widget.js"/> */}
			</div>
		</div>
	)
}
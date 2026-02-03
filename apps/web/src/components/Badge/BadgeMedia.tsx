import { MediaType } from "@recomendapp/types";
import * as React from "react"
import { Badge } from "../ui/badge";
import { useTranslations } from "next-intl";

interface BadgeMediaProps
	extends React.ComponentProps<typeof Badge> {
		type?: MediaType | null;
	}

const BadgeMedia = React.forwardRef<
	HTMLDivElement,
	BadgeMediaProps
>(({ type, variant, className, ...props }, ref) => {
	const common = useTranslations('common');
	return (
		<Badge variant={variant ?? 'accent-yellow'} className={className} {...props}>
		{type === 'movie'
			? common('messages.film', { count: 1 })
			: type === 'tv_series'
			? common('messages.tv_series', { count: 1 })
			: type === 'person'
			? common('messages.cast_and_crew')
			: type
		}
		</Badge>
	);
})
BadgeMedia.displayName = 'BadgeMedia'

export { BadgeMedia }
import * as React from "react"
import { Badge } from "../ui/badge";
import { useTranslations } from "next-intl";

interface BadgeMediaProps
	extends React.ComponentProps<typeof Badge> {
		type?: 'movie' | 'tv_series';
	}

const BadgeMedia = React.forwardRef<
	HTMLDivElement,
	BadgeMediaProps
>(({ type, variant, className, ...props }, ref) => {
	const common = useTranslations('common');
	return (
		<Badge variant={variant ?? type} className={className} {...props}>
		{type === 'movie'
			? common('messages.movie', { count: 1 })
			: type === 'tv_series'
			? common('messages.tv_series', { count: 1 })
			: type
		}
		</Badge>
	);
})
BadgeMedia.displayName = 'BadgeMedia'

export { BadgeMedia }
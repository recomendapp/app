"use client"

import { useAuth } from "@/context/auth-context";
import { title } from "@/utils/custom-lodash";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { usePathname } from '@/lib/i18n/navigation';
import { useMemo } from "react";

export const FeedNavbar = () => {
	const { customerInfo } = useAuth();
	const common = useTranslations('common');
	const pathname = usePathname();
	const routes = useMemo(() => [
		{
			label: upperFirst(common('messages.community')),
			active: pathname === '/feed',
			href: `/feed`,
			disabled: false,
		},
		{
			label: title(common('messages.cast_and_crew')),
			active: pathname === '/feed/cast-crew',
			href: customerInfo?.entitlements.active['premium'] ? `/feed/cast-crew` : '/upgrade',
			disabled: !customerInfo?.entitlements.active['premium'],
		},
	], [pathname, common, customerInfo]);

	return (
		<div className="inline-flex h-10 items-center justify-center bg-muted p-1 text-muted-foreground w-full max-w-xl rounded-md mb-4">
		{routes.map((item) => (
			<Link
			key={item.label}
			href={item.href}
			className={`w-full rounded-md inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium ring-offset-background transition-all 
				focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
				disabled:pointer-events-none disabled:opacity-50 
				${item.active && 'bg-background text-accent-yellow shadow-xs'}
			`}
			>
			{item.label}
			</Link>
		))}
		</div>
	);
}

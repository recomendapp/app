import * as React from "react";
import { Link, useRouter } from "@/lib/i18n/navigation"
import { cn } from "@/lib/utils";

interface WithLinkProps extends React.HTMLAttributes<HTMLDivElement | HTMLAnchorElement> {
  href?: string;
  as?: React.ElementType;
  withOnClick?: boolean;
}

export const WithLink = React.forwardRef<
  HTMLDivElement,
  WithLinkProps
>(({ href, as: Component = "div", className, withOnClick = false, onClick, children, ...props }, ref) => {
	const router = useRouter();
	const ComponentRender = (href && !withOnClick) ? Link : Component;
	return (
		<ComponentRender
		ref={ref}
		href={href ?? undefined}
		onClick={(e: React.MouseEvent<HTMLDivElement | HTMLAnchorElement>) => {
			href && router.push(href);
			onClick && onClick(e);
		}}
		className={cn(href ? "cursor-pointer" : "", className)}
		{...props}
		>
		{children}
		</ComponentRender>
	);
});
WithLink.displayName = 'WithLink'
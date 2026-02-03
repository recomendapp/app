import * as React from "react";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { cva, VariantProps } from "class-variance-authority";

const iconMediaRatingVariants = cva(
	"relative flex shadow-xs w-8 aspect-3/2 rounded-sm bg-background border-2 justify-center items-center shrink-0 font-bold text-sm",
	{
		variants: {
			variant: {
				general: "text-accent-yellow border-accent-yellow",
				follower: "text-accent-blue border-accent-blue",
				user: "text-accent-yellow border-accent-yellow",
				profile: "text-white border-muted",
			}
		}
	}
)

interface IconMediaRatingProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof iconMediaRatingVariants> {
	rating?: number | null;
	tooltip?: string | null;
	disableTooltip?: boolean;
	stopPropagation?: boolean;
}

const IconMediaRating = React.forwardRef<HTMLDivElement, IconMediaRatingProps>(
	({ rating, tooltip, disableTooltip, onClick, stopPropagation = true, variant = "general", className, ...props }, ref) => {
	if (!rating) return null;
	return (
	<TooltipBox
	tooltip={!disableTooltip ? (
		tooltip ?? (
			variant === "general"
			? "Note globale"
			: variant === "follower"
			? "Vos recomendeurs"
			: variant === "user"
			? "Votre note"
			: variant === "profile"
			? "Note du profil"
			: "Note"
		)
	) : null}
	>
		<div
		ref={ref}
		className={iconMediaRatingVariants({ variant, className })}
		onClick={(e) => {
			if (onClick) {
				stopPropagation && e.stopPropagation();
				onClick(e);
			}
		}}
		{...props}
		>
		{rating % 1 === 0 ? rating : rating.toFixed(1)}
		</div>
	</TooltipBox>
	);
});
IconMediaRating.displayName = "IconMediaRating";

export {
	IconMediaRating,
	iconMediaRatingVariants,
}
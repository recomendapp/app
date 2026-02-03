import { cn } from "@/lib/utils";
import React from "react";

interface CollectionIconProps extends React.HTMLAttributes<HTMLDivElement> {
	from: string;
	to: string;
	canHover?: boolean;
};

const CollectionIcon = React.forwardRef<
	HTMLDivElement,
	CollectionIconProps
>(({ children, from, to, canHover = true, className, ...props }, ref) => {
	return (
	  <div
		ref={ref}
		style={{
		  backgroundImage: `linear-gradient(to top right, ${from}, ${to})`,
		}}
		className={cn(`relative w-full rounded-md flex items-center justify-center aspect-square`, className)}
		{...props}
	  >
		{children}
		{canHover && <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />}
	  </div>
	);
});
CollectionIcon.displayName = "CollectionIcon";

export default CollectionIcon;
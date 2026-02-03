import { Button } from "../ui/button"
import { Icons } from "@/config/icons"
import { useUI } from "@/context/ui-context";
import { RightPanelNotifications } from "../sidebar/right-panel/RightPanelNotifications";
import { useCounts } from "@novu/react";
import { CircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

export const NotificationsButton = ({
	variant = 'outline',
	size = 'icon',
	onClick,
	className,
	...props
} : React.ComponentProps<typeof Button>) => {
	const t = useTranslations();
	const { counts } = useCounts({ filters: [{ read: false }] });
	const {
		toggleRightPanelContent,
	} = useUI();
	const handleOnClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		toggleRightPanelContent(RightPanelNotifications());
		onClick?.(e);
	}, [toggleRightPanelContent, onClick]);
	return (
		<Button variant={variant} size={size} className={cn("relative", className)} onClick={handleOnClick} {...props}>
			<Icons.bell className='w-4 h-4'/>
			<span className="sr-only">{upperFirst(t('common.messages.see_notifications'))}</span>
			{counts && counts[0].count > 0 && (
				<div className='absolute w-2 aspect-square rounded-full top-1 right-1 bg-accent-yellow fill-accent-yellow'/>
			)}
		</Button>
	)
}
import * as React from "react"
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { Link } from "@/lib/i18n/navigation";
import { Icons } from "@/config/icons";
import { usePathname } from '@/lib/i18n/navigation';
import { cn } from "@/lib/utils";
import { useModal } from "@/context/modal-context";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { ModalPlaylistTvSeriesAdd } from "../Modals/playlists/ModalPlaylistTvSeriesAdd";

interface ButtonPlaylistTvSeriesAddProps
	extends React.ComponentProps<typeof Button> {
		tvSeriesId: number;
		tvSeriesTitle?: string | null;
		stopPropagation?: boolean;
	}

const ButtonPlaylistTvSeriesAdd = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonPlaylistTvSeriesAddProps
>(({ tvSeriesId, stopPropagation = true, tvSeriesTitle, className, ...props }, ref) => {
	const { user } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();
	const { openModal } = useModal();

	const handleClick = React.useCallback((e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		openModal(ModalPlaylistTvSeriesAdd, { tvSeriesId, tvSeriesTitle: tvSeriesTitle! })
	}, [stopPropagation, openModal, tvSeriesId, tvSeriesTitle]);

	if (user === null) {
		return (
		  <TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
			<Button
			ref={ref}
			size="icon"
			variant={'outline'}
			className={cn("rounded-full", className)}
			asChild
			{...props}
			>
				<Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
					<Icons.addPlaylist />
				</Link>
			</Button>
		  </TooltipBox>
		);
	}

	return (
	<TooltipBox tooltip={upperFirst(t('common.messages.add_to_playlist'))}>
		<Button
		ref={ref}
		disabled={user === undefined}
		size="icon"
		variant={'outline'}
		className={cn("rounded-full", className)}
		onClick={handleClick}
		{...props}
		>
		{user === undefined ? <Icons.spinner className="animate-spin" /> : <Icons.addPlaylist />}
		</Button>
	</TooltipBox>
	);
});
ButtonPlaylistTvSeriesAdd.displayName = 'ButtonPlaylistTvSeriesAdd';

export default ButtonPlaylistTvSeriesAdd;

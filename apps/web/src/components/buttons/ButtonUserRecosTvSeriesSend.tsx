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
import { ModalUserRecosTvSeriesSend } from "../Modals/recos/ModalUserRecosTvSeriesSend";

interface ButtonUserRecosTvSeriesSendProps
	extends React.ComponentProps<typeof Button> {
		tvSeriesId: number;
		tvSeriesTitle?: string | null;
		stopPropagation?: boolean;
	}

const ButtonUserRecosTvSeriesSend = React.forwardRef<
	HTMLDivElement,
	ButtonUserRecosTvSeriesSendProps
>(({ tvSeriesId, stopPropagation = true, tvSeriesTitle, className, ...props }, ref) => {
	const { user } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();
	const { openModal } = useModal();

	const handleClick = React.useCallback((e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		openModal(ModalUserRecosTvSeriesSend, {
			tvSeriesId,
			tvSeriesTitle: tvSeriesTitle!,
		})
	}, [stopPropagation, openModal, tvSeriesId, tvSeriesTitle]);

	if (user === null) {
		return (
		  <TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
			<Button
			  size="icon"
			  variant={'outline'}
			  className={cn("rounded-full", className)}
			  asChild
			  {...props}
			>
			  <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
				<Icons.send />
			  </Link>
			</Button>
		  </TooltipBox>
		);
	  }

	  return (
		<TooltipBox tooltip={upperFirst(t('common.messages.send_to_friend'))}>
		  <Button
			disabled={user === undefined}
			size="icon"
			variant={'outline'}
			className={cn("rounded-full", className)}
			onClick={handleClick}
			{...props}
		  >
			{user === undefined ? <Icons.spinner className="animate-spin" /> : <Icons.send />}
		  </Button>
		</TooltipBox>
	  );
});
ButtonUserRecosTvSeriesSend.displayName = 'ButtonUserRecosTvSeriesSend';

export default ButtonUserRecosTvSeriesSend;

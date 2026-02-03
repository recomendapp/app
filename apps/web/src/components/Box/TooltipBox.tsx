import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { TooltipContentProps, TooltipPortal, TooltipTriggerProps } from '@radix-ui/react-tooltip';

interface TooltipBoxProps extends React.ComponentProps<typeof TooltipContent> {
	children: React.ReactNode;
	tooltip?: string | TooltipContentProps | null;
	tooltipTrigger?: TooltipTriggerProps;
}

export const TooltipBox: React.FC<TooltipBoxProps> = ({
	children,
	tooltip,
	tooltipTrigger,
	...props
}) => {
	if (!tooltip) return children;

	let tooltipContentProps: TooltipContentProps = {};

	if (typeof tooltip === 'string') {
		tooltipContentProps.children = tooltip;
	} else {
		tooltipContentProps = { ...tooltip };
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild {...tooltipTrigger}>
				{children}
			</TooltipTrigger>
			<TooltipPortal>
				<TooltipContent side="bottom" align="center" {...tooltipContentProps} {...props} />
			</TooltipPortal>
		</Tooltip>
	);
};
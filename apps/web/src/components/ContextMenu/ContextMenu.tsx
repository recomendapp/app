import { LucideProps } from "lucide-react";
import { ContextMenu as ContextMenuPrimitive, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuShortcut } from "../ui/context-menu"
import { ForwardRefExoticComponent, RefAttributes, JSX } from "react";
import { WithLink } from "../utils/WithLink";

export interface ContextMenuProps extends React.ComponentProps<typeof ContextMenuPrimitive> {
	className?: string;
	items: {
		icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>> | ((props: LucideProps) => JSX.Element);
		onClick?: () => void;
		href?: string;
		label: string;
		shortcut?: string;
		submenu?: any[];
	}[];
  }

export const ContextMenu = ({
	items,
	children,
	className,
	...props
} : ContextMenuProps) => {
	return (
		<ContextMenuPrimitive>
			<ContextMenuTrigger>
				{children}
			</ContextMenuTrigger>
			<ContextMenuContent>
			{items.map((item, index) => (
				<ContextMenuItem
				key={index}
				className="gap-2"
				asChild={!!item.href}
				onClick={item.onClick}
				>
					<WithLink href={item.href}>
						<item.icon className="h-4 w-4"/>
						{item.label}
						{item.shortcut ? (
						<ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
						) : null}
					</WithLink>
				</ContextMenuItem>
			))}
			</ContextMenuContent>
		</ContextMenuPrimitive>
	)
}
  
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { Icons } from "@/config/icons";
import { useUI } from "@/context/ui-context";

export const SidebarRight = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
	const { toggleSidebar } = useSidebar();
	const { rightPanel } = useUI();
	return (
		<Sidebar
		collapsible="offcanvas"
		side="right"
		{...props}
		>
			<SidebarHeader className="h-header flex-row items-center justify-between">
				{rightPanel?.title}
				<Button
				variant={'ghost'}
				size={'icon'}
				onClick={toggleSidebar}
				className="rounded-full h-6 w-6"
				>
					<span className="sr-only">Close</span>
					<Icons.close className="w-4 h-4" />
				</Button>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				{rightPanel ? <rightPanel.component {...rightPanel.props} /> : null}
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
 
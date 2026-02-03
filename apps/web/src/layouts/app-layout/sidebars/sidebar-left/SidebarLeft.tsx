import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { Link } from "@/lib/i18n/navigation";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { Icons } from "@/config/icons";
import { SidebarLeftRoutes } from "./SidebarLeftRoutes";
import { useUI } from "@/context/ui-context";

export const SidebarLeft = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
	const { toggleSidebar, sidebarOpen: open } = useUI();
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={toggleSidebar} className="fill-accent-yellow" asChild>
							{open ? (
								<Icons.site.logo className={`${open ? "w-full" : "w-0"}`} />
							) : (
								<Icons.site.icon className={`${open ? "w-8" : "w-4"}`} />
							)}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				<SidebarLeftRoutes />
			</SidebarContent>
			<SidebarSeparator />
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex justify-center items-center"
					 	>
							<Link
							href={"https://oneummah.org.uk/appeals/gaza-emergency-appeal/"}
							target="_blank"
							>
								<ImageWithFallback
								src="/assets/free-palestine-min.webp"
								alt="Free Palestine"
								width={80}
								height={80}
								/>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

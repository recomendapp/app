'use client'
import { Header } from '@/components/Header/Header';
import { useUI } from '@/context/ui-context';
import { Navbar } from "../../components/Navbar";
import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar";
import { SidebarLeft } from "./sidebars/sidebar-left/SidebarLeft";
import { SidebarRight } from './sidebars/sidebar-right/SidebarRight';

export function AppLayout({
	children,
 } : {
	children: React.ReactNode;
 }) {
	const {
		sidebarOpen,
		sidebarOpenMobile,
		setSidebarOpenMobile,
		sidebarOpenChange,
		rightPanelOpen,
		rightPanelOpenChange,
		rightPanelOpenMobile,
		setRightPanelOpenMobile,
		device,
	} = useUI();

	return (
		<SidebarProvider
		open={sidebarOpen}
		onOpenChange={sidebarOpenChange}
		openMobile={sidebarOpenMobile}
		setOpenMobile={setSidebarOpenMobile}
		className="min-h-screen"
		>
			<SidebarLeft />
			<SidebarInset className={`@container/main ${device === "mobile" ? "pb-(--navbar-height) md:pb-0" : ""}`}>
				<Header className={`${device === "mobile" ? "hidden" : ""}`} />
				{children}
			</SidebarInset>
			<SidebarProvider
			open={rightPanelOpen}
			onOpenChange={rightPanelOpenChange}
			className='w-auto'
			shortcut='p'
			openMobile={rightPanelOpenMobile}
			setOpenMobile={setRightPanelOpenMobile}
			>
				<SidebarRight />
			</SidebarProvider>
			{device === 'mobile' ? <Navbar className={`fixed bottom-0 left-0 z-50 md:hidden`} /> : null}
		</SidebarProvider>
	)
}
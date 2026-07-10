import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Icons } from '@/config/icons';
import { SidebarLeftRoutes } from './SidebarLeftRoutes';
import { useUI } from '@/context/ui-context';
import { useAuth } from '@/context/auth-context';
import AdBanner from '@/components/Ads/AdBanner';
import { useTranslations } from 'next-intl';

export const SidebarLeft = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { toggleSidebar, sidebarOpen: open } = useUI();
  const { session } = useAuth();
  const t = useTranslations();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} className="fill-accent-yellow" asChild>
              {open ? (
                <Icons.site.logo className={`${open ? 'w-full' : 'w-0'}`} />
              ) : (
                <Icons.site.icon className={`${open ? 'w-8' : 'w-4'}`} />
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
      {session === null && (
        <SidebarFooter>
          <div className="w-full max-w-[250px] max-h-[250px] overflow-hidden">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block text-center">
              {t('common.messages.advertisement', { count: 1 })}
            </span>
            <AdBanner dataAdSlot="9520100200" className="my-0 min-h-[250px]" />
          </div>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
};

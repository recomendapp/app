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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/config/icons';
import { SidebarLeftRoutes } from './SidebarLeftRoutes';
import { useUI } from '@/context/ui-context';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

const IOS_APP_STORE_URL = 'https://apps.apple.com/app/recomend/id6749225891';

export const SidebarLeft = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { toggleSidebar, sidebarOpen: open } = useUI();
  const t = useTranslations('common');
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
      <SidebarFooter>
        <div className="text-sm group-data-[collapsible=icon]:hidden">
          {t('messages.new_mobile_app')}
        </div>
        <SidebarMenu className="flex-row items-center justify-center group-data-[collapsible=icon]:flex-col">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('messages.ios_app')} asChild>
              <Link href={IOS_APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Icons.apple />
                <span className="sr-only">{t('messages.ios_app')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <SidebarMenuButton disabled className="w-full">
                    <Icons.android />
                    <span className="sr-only">{t('messages.android_app')}</span>
                  </SidebarMenuButton>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">{t('messages.coming_soon')}</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      {/*{session === null && (
      <>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="w-full max-w-[250px] max-h-[250px] overflow-hidden">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block text-center">
              {t('common.messages.advertisement', { count: 1 })}
            </span>
            <AdBanner dataAdSlot="9520100200" className="my-0 min-h-[250px]" />
          </div>
        </SidebarFooter>
      </>
      )}*/}
      <SidebarRail />
    </Sidebar>
  );
};

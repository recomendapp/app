import { ReactQueryProvider } from '@/context/react-query-context';
import { AuthProvider } from '@/context/auth-context';
import { MapContext } from '@/context/map-context';
import { NextIntlClientProvider } from 'next-intl';
import { SupabaseProvider } from '@/context/supabase-context';
import { NotificationsProvider } from '@/context/notifications-context';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { Icons } from '@/config/icons';
import { getServerDevice } from '@/utils/get-device';
import { ThemeProvider } from 'next-themes';
import { UIProvider } from './ui-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ModalProvider } from './modal-context';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'react-hot-toast';
import { SupportedLocale } from '@/translations/locales';
import { ApiProvider } from './api-context';
import { checkMaintenance } from '@/api/server/utils';

export const Providers = async ({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: SupportedLocale;
}) => {
  const supabase = await createServerClient({ locale: locale });
  const [
    sessionRes,
    isMaintenanceMode,
    cookiesStore,
    device,
  ] = await Promise.all([
    supabase.auth.getSession(),
    checkMaintenance(),
    cookies(),
    getServerDevice(),
  ]);
  const session = sessionRes.data.session;
  // UI
  const layout = cookiesStore.get("ui:layout");
  const sidebarOpen = cookiesStore.get("ui-sidebar:open");
  const rightPanelOpen = cookiesStore.get("ui-right-panel:open");
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;

  return (
    <NextIntlClientProvider locale={locale}>
      <SupabaseProvider>
        <ReactQueryProvider>
          <AuthProvider session={session}>
            <ApiProvider>
              <NotificationsProvider>
                <MapContext>
                  <ThemeProvider attribute={'class'} defaultTheme='dark' enableSystem>
                    <UIProvider
                    defaultLayout={defaultLayout}
                    cookieSidebarOpen={sidebarOpen ? JSON.parse(sidebarOpen.value) : undefined}
                    cookieRightPanelOpen={rightPanelOpen ? JSON.parse(rightPanelOpen.value) : undefined}
                    device={device}
                    >
                      <TooltipProvider delayDuration={100}>
                        <ModalProvider>
                          <NextTopLoader
                            showSpinner={false}
                            easing="ease"
                            color="#FFE974"
                            height={2}
                          />
                          <Toaster
                            position="top-center"
                            toastOptions={{
                              style: {
                                borderRadius: '10px',
                                background: '#333',
                                color: '#fff',
                              },
                            }}
                          />
                          {isMaintenanceMode ? <MaintenancePage /> : children}
                        </ModalProvider>
                      </TooltipProvider>
                    </UIProvider>
                  </ThemeProvider>
                </MapContext> 
              </NotificationsProvider>
            </ApiProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </SupabaseProvider>
    </NextIntlClientProvider>
  );
};

const MaintenancePage: React.FC = () => {
  return (
    <div className='h-screen w-screen p-4'>
      <div className='w-full h-full bg-background p-4 rounded-md flex flex-col items-center justify-center'>
        <Icons.site.logo className="fill-accent-yellow w-96" />
        <h1 className=' text-muted-foreground text-2xl'>Maintenance Mode</h1>
      </div>
    </div>
  );
};

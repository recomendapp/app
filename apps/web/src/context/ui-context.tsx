'use client';

import { RightPanelSocial } from '@/components/sidebar/right-panel/RightPanelSocial';
import { RightPanel } from '@/components/sidebar/right-panel/RightPanelUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from './auth-context';
import { createContext, use, useCallback, useState } from 'react';
import { Device } from '@/utils/get-device';
import { useDevice } from '@/hooks/use-device';

export const SIDEBAR_COOKIE_NAME = "ui-sidebar:open";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
export const RIGHT_PANEL_COOKIE_NAME = "ui-right-panel:open";
const RIGHT_PANEL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "5rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

export interface UiContextProps {
  uiLayout: number[];
  setUiLayout: (layout: number[]) => void;
  sidebarOpen: boolean;
  sidebarOpenChange: (open: boolean) => void;
  sidebarOpenMobile: boolean;
  setSidebarOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
  rightPanelOpen: boolean;
  rightPanelOpenChange: (open: boolean) => void;
  rightPanelOpenMobile: boolean;
  setRightPanelOpenMobile: (open: boolean) => void;
  rightPanel: RightPanel<any> | null;
  toggleRightPanel: (open?: boolean) => void;
  toggleRightPanelContent: <P,>({
    title,
    component,
    props,
  } : {
    title: string;
    component: React.ComponentType<P>;
    props: P;
  }) => void;
  device: Device;
  isMobile: boolean;
}

const UIContext = createContext<UiContextProps | undefined>(undefined);

export const UIProvider = ({
  children,
  defaultLayout = [265, 440, 0],
	cookieSidebarOpen = true,
  cookieRightPanelOpen = true,
  device: deviceProps,
} : {
  children: React.ReactNode;
  defaultLayout: number[] | undefined
	cookieSidebarOpen?: boolean
  cookieRightPanelOpen?: boolean
  device: Device;
}) => {
  const { session } = useAuth();
  const isMobile = useIsMobile();
  // LAYOUT
  const [ uiLayout, setUiLayout ] = useState(defaultLayout);
  // *========== START SIDEBAR ==========*
  const [ sidebarOpen, setSidebarOpen ] = useState(cookieSidebarOpen);
  const [ sidebarOpenMobile, setSidebarOpenMobile ] = useState(false);
  const sidebarCollapsedSize = 2;
  const sidebarMinSize = 14;
  const sidebarMaxSize = 20;
  // const sidebarOpenChange = (open: boolean) => {
  //   setSidebarOpen(open);
  //   // Save to cookie
  //   document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  // }
  const sidebarOpenChange = useCallback((open: boolean) => {
    setSidebarOpen(open);
    // Save to cookie
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }, []);
  const toggleSidebar = useCallback(() => {
    return isMobile
      ? setSidebarOpenMobile((open) => !open)
      : sidebarOpenChange(!sidebarOpen);
  }, [isMobile, sidebarOpen, sidebarOpenChange]);
  // *========== END SIDEBAR ==========*

  // *========== START RIGHTPANEL ==========*
  const [ rightPanelOpen, setRightPanelOpen ] = useState(
    session ? cookieRightPanelOpen : false
  );
  const [ rightPanelOpenMobile, setRightPanelOpenMobile ] = useState(false);
  const [ rightPanel, setRightPanel ] = useState<RightPanel<any> | null>(session ? RightPanelSocial : null);
  const rightPanelCollapsedSize = 0;
  const rightPanelMinSize = 20;
  const rightPanelMaxSize = 30;
  // const rightPanelOpenChange = (open: boolean) => {
  //   setRightPanelOpen(open);
  //   // Save to cookie
  //   document.cookie = `${RIGHT_PANEL_COOKIE_NAME}=${open}; path=/; max-age=${RIGHT_PANEL_COOKIE_MAX_AGE}`;
  // }
  const rightPanelOpenChange = useCallback((open: boolean) => {
    setRightPanelOpen(open);
    // Save to cookie
    document.cookie = `${RIGHT_PANEL_COOKIE_NAME}=${open}; path=/; max-age=${RIGHT_PANEL_COOKIE_MAX_AGE}`;
  }, []);
  const toggleRightPanel = useCallback((open?: boolean) => {
    const newState = open !== undefined ?
      open :
      isMobile ? !rightPanelOpenMobile : !rightPanelOpen;
    
    if (isMobile) {
      setRightPanelOpenMobile(newState);
    } else {
      rightPanelOpenChange(newState);
    }
  }, [isMobile, rightPanelOpen, rightPanelOpenChange, rightPanelOpenMobile]);

  const toggleRightPanelContent = <P,>(content: RightPanel) => {
    if (content.onlyAuth && !session) return;
    const isSameContent = rightPanel?.title === content.title && rightPanel?.component === content.component && JSON.stringify(rightPanel?.props) === JSON.stringify(content.props);
    if (isSameContent) {
      toggleRightPanel();
    } else {
      setRightPanel(content)
      toggleRightPanel(true);
    }
  }
  
  // *========== END RIGHTPANEL ==========*

  const device = useDevice({ device: deviceProps });

  return (
    <UIContext.Provider
      value={{
        uiLayout,
        setUiLayout,
        // Sidebar
        sidebarOpen,
        sidebarOpenMobile,
        setSidebarOpenMobile,
        sidebarOpenChange,
        toggleSidebar,
        // RightPanel
        rightPanelOpen,
        rightPanelOpenChange,
        rightPanelOpenMobile,
        setRightPanelOpenMobile,
        rightPanel,
        toggleRightPanel,
        toggleRightPanelContent,
        device,
        isMobile,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = use(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIContext');
  }
  return context;
}

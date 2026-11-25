import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, {
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import type { Profile } from '@libs/api-js';
import type { ContextMenuItem } from '../../../ui/context-menu';

/** What a tab offers when the reader taps the tab they are already on. */
type ProfileTabMenu = { title?: string; items: ContextMenuItem[] };

/** The tab routes of `user/[username]/(profile)`, in the order they are shown. */
const PROFILE_TABS = ['index', 'films', 'tv-series', 'playlists'] as const;

/** How far the reader has to pull past the top to ask for a refresh. */
const PULL_THRESHOLD = 80;

/** The room the overlay keeps for the spinner while a refresh runs. */
const REFRESH_BAND = 44;

type ProfileTab = (typeof PROFILE_TABS)[number];

type ProfileTabHandle = {
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
  refresh: () => Promise<unknown> | unknown;
};

type ProfileTabsContextValue = {
  /**
   * Whose profile this is. Read from here and not from the route: the tabs are
   * children of this navigator, and `useLocalSearchParams` only resolves a
   * dynamic segment for the route that declares it, or for a layout.
   */
  profile?: Profile;
  profileIsLoading: boolean;
  /** Refetches the profile the header shows, for a tab that pulls to refresh. */
  refreshProfile: () => Promise<unknown>;
  /**
   * What a tab offers in its menu, which opens on a tap on the tab it is
   * already showing. State rather than a ref: the tab bar draws it, so it has
   * to re-render when the tab changes what it offers.
   */
  menus: Partial<Record<ProfileTab, ProfileTabMenu>>;
  setTabMenu: (tab: ProfileTab, menu: ProfileTabMenu | undefined) => void;
  /** Each tab's own scroll offset, so every tab keeps its place. */
  offsets: Record<ProfileTab, SharedValue<number>>;
  /** The scrollables themselves, so a drag on the header can scroll one. */
  scrollRefs: Record<ProfileTab, AnimatedRef<Animated.ScrollView>>;
  focusedTab: SharedValue<ProfileTab>;
  /** The focused tab's offset -- what the header follows. */
  focusedOffset: SharedValue<number>;
  /** How far the header travels before the tab bar meets the navigation bar. */
  collapseRange: SharedValue<number>;
  /** Everything the overlay covers: the profile header and the tab bar. */
  overlayHeight: number;
  /** How far a drag on the header has pulled past the top of the list. */
  dragPull: SharedValue<number>;
  /**
   * What the focused list has to move by to stay with the header: a pull the
   * list never saw, plus the room the spinner keeps while a refresh runs. The
   * list's own bounce is not in here -- it moves itself.
   */
  contentShift: SharedValue<number>;
  isRefreshing: SharedValue<boolean>;
  measureOverlay: (height: number) => void;
  measureTabBar: (height: number) => void;
  registerTab: (tab: ProfileTab, handle: ProfileTabHandle | null) => void;
  focusTab: (tab: ProfileTab) => void;
  /** Called when a list is let go, to decide whether the pull asked for a refresh. */
  releasePull: () => void;
  /**
   * Brings the other tabs to where the focused one left the header, so every
   * tab agrees on how much of it is showing.
   */
  syncOffsets: (offset?: number) => void;
  /** Refreshes the focused tab, for a pull the list itself never saw. */
  requestRefresh: () => void;
};

const ProfileTabsContext = createContext<ProfileTabsContextValue | undefined>(undefined);

/**
 * Holds what the four profile tabs share: the scroll offsets the collapsing
 * header reads, the scrollables a drag on that header has to move, and the
 * measurements that say how far the header may travel.
 *
 * One shared value and one ref per tab rather than a registry of them: the
 * routes are known up front, and a worklet can only reach what its own closure
 * holds.
 */
const ProfileTabsProvider = ({
  profile,
  profileIsLoading,
  refreshProfile,
  children,
}: {
  profile?: Profile;
  profileIsLoading: boolean;
  refreshProfile: () => Promise<unknown>;
  children: React.ReactNode;
}) => {
  const indexOffset = useSharedValue(0);
  const filmsOffset = useSharedValue(0);
  const tvSeriesOffset = useSharedValue(0);
  const playlistsOffset = useSharedValue(0);

  const indexRef = useAnimatedRef<Animated.ScrollView>();
  const filmsRef = useAnimatedRef<Animated.ScrollView>();
  const tvSeriesRef = useAnimatedRef<Animated.ScrollView>();
  const playlistsRef = useAnimatedRef<Animated.ScrollView>();

  const offsets = useMemo<Record<ProfileTab, SharedValue<number>>>(
    () => ({
      index: indexOffset,
      films: filmsOffset,
      'tv-series': tvSeriesOffset,
      playlists: playlistsOffset,
    }),
    [indexOffset, filmsOffset, tvSeriesOffset, playlistsOffset],
  );

  const scrollRefs = useMemo<Record<ProfileTab, AnimatedRef<Animated.ScrollView>>>(
    () => ({
      index: indexRef,
      films: filmsRef,
      'tv-series': tvSeriesRef,
      playlists: playlistsRef,
    }),
    [indexRef, filmsRef, tvSeriesRef, playlistsRef],
  );

  const focusedTab = useSharedValue<ProfileTab>('index');
  // Reanimated collects what a derived value reads on each run, so this follows
  // whichever offset the focused tab names.
  const focusedOffset = useDerivedValue(() => offsets[focusedTab.value].value);

  const [overlayHeight, setOverlayHeight] = useState(0);
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const collapseRange = useSharedValue(0);
  useEffect(() => {
    collapseRange.set(Math.max(0, overlayHeight - tabBarHeight));
  }, [collapseRange, overlayHeight, tabBarHeight]);

  const [menus, setMenus] = useState<Partial<Record<ProfileTab, ProfileTabMenu>>>({});

  const setTabMenu = useCallback((tab: ProfileTab, menu: ProfileTabMenu | undefined) => {
    setMenus((current) => (current[tab] === menu ? current : { ...current, [tab]: menu }));
  }, []);

  const dragPull = useSharedValue(0);
  const isRefreshing = useSharedValue(false);
  // While a refresh runs, the header stays pushed down, the way a native pull
  // keeps its spinner on screen after the finger is gone.
  const refreshBand = useDerivedValue(() =>
    withTiming(isRefreshing.value ? REFRESH_BAND : 0, { duration: 180 }),
  );
  const contentShift = useDerivedValue(() => dragPull.value + refreshBand.value);
  const handles = useRef(new Map<ProfileTab, ProfileTabHandle>());

  const measureOverlay = useCallback((height: number) => {
    setOverlayHeight((current) => (Math.abs(current - height) < 1 ? current : height));
  }, []);

  const measureTabBar = useCallback((height: number) => {
    setTabBarHeight((current) => (Math.abs(current - height) < 1 ? current : height));
  }, []);

  const registerTab = useCallback((tab: ProfileTab, handle: ProfileTabHandle | null) => {
    if (handle) {
      handles.current.set(tab, handle);
    } else {
      handles.current.delete(tab);
    }
  }, []);

  /**
   * Only the part of the scroll the header occupies is shared. Past it, every
   * tab keeps its own place: any offset beyond the range means the same fully
   * collapsed header, so there is nothing to agree on.
   */
  const syncOffsets = useCallback(
    (offset?: number) => {
      const focused = focusedTab.get();
      const shared = offset ?? offsets[focused].get();
      // Nothing to agree on once the header is gone: every offset at or past
      // the range describes the same fully collapsed header, so each tab may
      // keep its own place.
      if (shared >= collapseRange.get()) return;

      PROFILE_TABS.forEach((tab) => {
        if (tab === focused || Math.abs(offsets[tab].get() - shared) < 1) return;
        handles.current.get(tab)?.scrollToOffset({ offset: shared, animated: false });
      });
    },
    [collapseRange, focusedTab, offsets],
  );

  const focusTab = useCallback(
    (tab: ProfileTab) => {
      const previous = focusedTab.get();
      focusedTab.set(tab);
      if (previous === tab) return;

      // The header reads the focused tab, so the arriving list is moved to
      // where the header already is -- in either direction. A tab resting
      // higher would spring the header open under the reader's thumb; a tab
      // resting deeper would slam it shut.
      const range = collapseRange.get();
      const target = Math.min(offsets[previous].get(), range);
      const arriving = offsets[tab].get();
      // Showing part of the header: every tab has to sit at that exact offset.
      // Header gone: anything at or past the range already agrees with it.
      const isOff = target < range ? arriving !== target : arriving < range;

      if (isOff) {
        handles.current.get(tab)?.scrollToOffset({ offset: target, animated: false });
      }

      // The tabs left behind are told as well: the arriving tab's shared value
      // cannot be read back yet, so the offset is passed along.
      syncOffsets(isOff ? target : arriving);
    },
    [collapseRange, focusedTab, offsets, syncOffsets],
  );

  const requestRefresh = useCallback(() => {
    const handle = handles.current.get(focusedTab.get());
    if (isRefreshing.get() || !handle) return;

    isRefreshing.set(true);
    Promise.resolve(handle.refresh()).finally(() => isRefreshing.set(false));
  }, [focusedTab, isRefreshing]);

  const releasePull = useCallback(() => {
    if (offsets[focusedTab.get()].get() > -PULL_THRESHOLD) return;
    requestRefresh();
  }, [focusedTab, offsets, requestRefresh]);

  const value = useMemo<ProfileTabsContextValue>(
    () => ({
      profile,
      profileIsLoading,
      refreshProfile,
      menus,
      setTabMenu,
      offsets,
      scrollRefs,
      focusedTab,
      focusedOffset,
      collapseRange,
      overlayHeight,
      dragPull,
      contentShift,
      isRefreshing,
      measureOverlay,
      measureTabBar,
      registerTab,
      focusTab,
      releasePull,
      syncOffsets,
      requestRefresh,
    }),
    [
      profile,
      profileIsLoading,
      refreshProfile,
      menus,
      setTabMenu,
      offsets,
      scrollRefs,
      focusedTab,
      focusedOffset,
      collapseRange,
      overlayHeight,
      dragPull,
      contentShift,
      isRefreshing,
      measureOverlay,
      measureTabBar,
      registerTab,
      focusTab,
      releasePull,
      syncOffsets,
      requestRefresh,
    ],
  );

  return <ProfileTabsContext.Provider value={value}>{children}</ProfileTabsContext.Provider>;
};

const useProfileTabs = () => {
  const context = use(ProfileTabsContext);
  if (!context) {
    throw new Error('useProfileTabs must be used within a ProfileTabsProvider');
  }
  return context;
};

/**
 * What a tab needs to take part in the shared header: the shared value its list
 * writes its offset into, the animated ref the header drags, the room the
 * overlay takes at the top, and the handle the provider reaches back through.
 */
const useProfileTab = (
  tab: ProfileTab,
  handle: {
    scrollToOffset: ProfileTabHandle['scrollToOffset'];
    refresh: () => unknown;
    /** Memoize it: the tab bar re-renders whenever its identity changes. */
    menu?: ProfileTabMenu;
  },
) => {
  const { offsets, scrollRefs, overlayHeight, registerTab, releasePull, syncOffsets, setTabMenu } =
    useProfileTabs();

  const { menu } = handle;
  useEffect(() => {
    setTabMenu(tab, menu);
    return () => setTabMenu(tab, undefined);
  }, [menu, setTabMenu, tab]);

  // Read through a ref: both callbacks are written inline at the call site, so
  // depending on their identity would re-register the tab on every render.
  const latest = useRef(handle);
  useEffect(() => {
    latest.current = handle;
  });
  useEffect(() => {
    registerTab(tab, {
      scrollToOffset: (params) => latest.current.scrollToOffset(params),
      refresh: () => latest.current.refresh(),
    });
    return () => registerTab(tab, null);
  }, [registerTab, tab]);

  return {
    scrollOffset: offsets[tab],
    scrollRef: scrollRefs[tab],
    overlayHeight,
    releasePull,
    syncOffsets,
  };
};

export {
  PROFILE_TABS,
  PULL_THRESHOLD,
  REFRESH_BAND,
  ProfileTabsProvider,
  useProfileTab,
  useProfileTabs,
};
export type { ProfileTab, ProfileTabMenu };

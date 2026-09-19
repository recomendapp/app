/**
 * Prop/configuration types shared by the home screen widgets. Type-only, so
 * importing this file has no runtime cost inside a `'widget'`-marked
 * component (types are erased at compile time).
 */

export type WidgetCarouselItem = {
  id: string;
  title: string;
  /** Local `file://` URI inside `widgetsDirectory`, or `''` when unavailable. */
  backdropUri: string;
  mediaType: 'movie' | 'tv_series';
  /** Extra line under the title, e.g. who recommended it. */
  subtitle?: string;
  /** In-app deep link opened when the card is tapped, e.g. `recomend:///film/123`. */
  deepLink: string;
};

export type WidgetCarouselProps = {
  items: WidgetCarouselItem[];
  /**
   * Badge text, e.g. "For later" or "My recos". Localized app-side (the
   * widget runtime can't run `use-intl`) and pushed with every snapshot.
   */
  label: string;
  /**
   * Hex color for the badge icon, e.g. `colors.accentBlue`. Resolved from
   * the live theme app-side (the widget runtime can't run `useTheme()`) and
   * pushed with every snapshot, same as `label`.
   */
  accentColor?: string;
  /**
   * Index of the item currently shown. Cycled locally by the prev/next
   * buttons (WidgetKit has no scroll/swipe gestures), so it lives on the
   * widget's own props rather than being pushed by the app. Resets to 0 the
   * next time the app pushes a fresh `items` snapshot.
   */
  currentIndex?: number;
};

export type WidgetOrderConfiguration = {
  order: 'recent' | 'random';
};

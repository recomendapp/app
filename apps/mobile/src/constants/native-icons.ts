import { Icon, type IconName } from '@expo/ui';

// Native per-platform icons: an SF Symbol on iOS, a Material Symbol vector
// drawable on Android. No lucide or SVG involved, unlike `Icons.tsx` next to
// this file, which stays the source for everything rendered as a React
// component. These are native views, so they only render through `@expo/ui`'s
// own `<Icon name={NativeIcons.key} />` inside a `<Host>`.
//
// `Icon.select` pairs the two sources and `@expo/ui/babel-plugin` (resolved by
// babel-preset-expo when `@expo/ui` is installed) drops the unused side per
// platform at build time. Both are type-checked: `ios` against the
// `sf-symbols-typescript` union, `android` against what
// `@expo/material-symbols` actually ships, so a typo fails the build instead
// of silently rendering nothing.
//
// The key union is spelled out and the record annotated with `IconName`
// because the type `Icon.select` infers reaches into `sf-symbols-typescript`,
// which TypeScript cannot name from its hoisted path (TS2742). Adding an icon
// therefore means adding its key here as well.
export type NativeIconKey = 'trash' | 'close';

export const NativeIcons: Record<NativeIconKey, IconName> = {
  trash: Icon.select({ ios: 'trash', android: import('@expo/material-symbols/delete.xml') }),
  close: Icon.select({ ios: 'xmark', android: import('@expo/material-symbols/close.xml') }),
};

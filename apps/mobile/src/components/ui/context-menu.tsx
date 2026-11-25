import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SFSymbol } from 'expo-symbols';

type ContextMenuItem = {
  label: string;
  /** A second line under the label, for what the choice currently means. */
  description?: string;
  onPress: () => void;
  /** An SF Symbol, shown next to the label on iOS. */
  systemImage?: SFSymbol;
  /** Marks the current choice: a symbol on iOS, a tinted row on Android. */
  selected?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

type ContextMenuProps = {
  /** A heading above the items, saying what the menu is for. */
  title?: string;
  items: ContextMenuItem[];
  /** What opens the menu. One child, which keeps its own look. */
  children: ReactElement;
  style?: StyleProp<ViewStyle>;
};

/**
 * A native menu opened by a tap on its child: SwiftUI's `Menu` on iOS, a
 * Material `DropdownMenu` on Android.
 *
 * This file is the fallback for every other platform, where the child is left
 * to itself.
 */
const ContextMenu = ({ children }: ContextMenuProps) => children;

export { ContextMenu };
export type { ContextMenuItem, ContextMenuProps };

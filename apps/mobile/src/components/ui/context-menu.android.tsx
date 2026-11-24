import { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  RNHostView,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import type { ContextMenuProps } from './context-menu';
import { useTheme } from '../../providers/ThemeProvider';

/** What stands in for an SF Symbol in a supporting line. */
const ARROWS: Record<string, string> = {
  'arrow.down': '↓',
  'arrow.up': '↑',
  'arrow.up.arrow.down': '↕',
  checkmark: '✓',
};

/**
 * The Material counterpart: a `DropdownMenu` anchored to its trigger, opened by
 * a tap rather than the long press a context menu would ask for.
 */
const ContextMenu = ({ title, items, children, style }: ContextMenuProps) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  // A Material menu has no heading, so the title is a row that does nothing.
  const rows = title ? [{ label: title, heading: true as const }, ...items] : items;

  return (
    <Host matchContents style={style}>
      <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
        <DropdownMenu.Trigger>
          <RNHostView matchContents>
            {/* The trigger swallows the touch rather than the child: the
                child is a control of its own -- a tab, a button -- and its own
                `onPress` would take the tap first and the menu would never
                open. */}
            <Pressable onPress={() => setExpanded(true)}>
              <View pointerEvents="none">{children}</View>
            </Pressable>
          </RNHostView>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {rows.map((row, index) => {
            const heading = 'heading' in row;
            const item = heading ? undefined : row;
            // A leading icon needs a drawable; the arrow rides on the
            // supporting line instead, which is where it belongs anyway.
            const arrow = item?.systemImage ? ARROWS[item.systemImage] : undefined;
            const description = item?.description
              ? [arrow, item.description].filter(Boolean).join(' ')
              : undefined;

            return (
              <DropdownMenuItem
                key={index}
                shape={{ index, count: rows.length }}
                enabled={!heading && !item?.disabled}
                elementColors={{
                  textColor: heading
                    ? colors.mutedForeground
                    : item?.destructive
                      ? colors.destructive
                      : item?.selected
                        ? colors.primary
                        : undefined,
                  disabledTextColor: heading ? colors.mutedForeground : undefined,
                }}
                onClick={
                  heading
                    ? undefined
                    : () => {
                        setExpanded(false);
                        item?.onPress();
                      }
                }
              >
                <DropdownMenuItem.Text>
                  <ComposeText>{row.label}</ComposeText>
                </DropdownMenuItem.Text>
                {description ? (
                  <DropdownMenuItem.SupportingText>
                    <ComposeText>{description}</ComposeText>
                  </DropdownMenuItem.SupportingText>
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
};

export { ContextMenu };

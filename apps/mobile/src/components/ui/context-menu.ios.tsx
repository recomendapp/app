import { Button, Host, Image, Menu, RNHostView, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { disabled as disabledModifier } from '@expo/ui/swift-ui/modifiers';
import type { ContextMenuItem, ContextMenuProps } from './context-menu';

/**
 * SwiftUI's `Menu` opens on a single tap, which is what a tab needs --
 * `ContextMenu` would ask for a long press. The trigger is the child itself,
 * hosted back into SwiftUI so it keeps its React Native look.
 */
const ContextMenu = ({ title, items, children, style }: ContextMenuProps) => {
  // A menu where one row is the current choice marks it the way the system
  // does, with a checkmark, and UIKit keeps that column for every row -- which
  // is also what keeps the labels in line. A leading symbol cannot do it: the
  // row is built from the symbol's name, so a row without one has no column to
  // leave empty, and no colour or opacity makes a symbol hold a place
  // invisibly.
  const isChoice = items.some((item) => item.selected !== undefined);
  const rows = items.map((item, index) => <MenuRow key={index} item={item} isChoice={isChoice} />);

  return (
    <Host matchContents style={style}>
      <Menu label={<RNHostView matchContents>{children}</RNHostView>}>
        {title ? <Section title={title}>{rows}</Section> : rows}
      </Menu>
    </Host>
  );
};

/**
 * In a menu, SwiftUI reads the first text of a label as the title and the
 * second as the subtitle, for both a `Button` and a `Toggle`. A plain row can
 * say it all through `label`; one with a subtitle has to be built from its
 * parts, where `systemImage` is ignored anyway.
 */
const MenuRow = ({ item, isChoice }: { item: ContextMenuItem; isChoice: boolean }) => {
  const modifiers = item.disabled ? [disabledModifier(true)] : [];

  const label = item.description
    ? [<Text key="label">{item.label}</Text>, <Text key="description">{item.description}</Text>]
    : undefined;

  if (isChoice) {
    return (
      <Toggle
        isOn={!!item.selected}
        label={label ? undefined : item.label}
        modifiers={modifiers}
        onIsOnChange={item.onPress}
      >
        {label}
      </Toggle>
    );
  }

  if (!label) {
    return (
      <Button
        label={item.label}
        systemImage={item.systemImage}
        role={item.destructive ? 'destructive' : undefined}
        modifiers={modifiers}
        onPress={item.onPress}
      />
    );
  }

  return (
    <Button
      role={item.destructive ? 'destructive' : undefined}
      modifiers={modifiers}
      onPress={item.onPress}
    >
      {[
        ...label,
        ...(item.systemImage ? [<Image key="icon" systemName={item.systemImage} />] : []),
      ]}
    </Button>
  );
};

export { ContextMenu };

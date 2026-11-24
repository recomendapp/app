import { isAndroid } from '../../platform/detection';
import { useTheme } from '../../providers/ThemeProvider';
import {
  TrueSheet as RNTrueSheet,
  TrueSheetProps as RNTrueSheetProps,
  SheetDetent,
} from '@lodev09/react-native-true-sheet';
import { forwardRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TrueSheetProps extends RNTrueSheetProps {
  lightColor?: string;
  darkColor?: string;
}

const TrueSheet = forwardRef<React.ComponentRef<typeof RNTrueSheet>, TrueSheetProps>(
  ({ backgroundStyle, detents, presentation = 'form', style, children, ...props }, ref) => {
    const { colors, isLiquidGlassAvailable } = useTheme();
    const insets = useSafeAreaInsets();

    const sheetDetents: SheetDetent[] = detents?.length ? detents : ['auto'];

    // The content box is sized by its own contents, which leaves a plugged
    // list nothing to render into: FlashList draws the rows it believes are on
    // screen, and a box that waits for the rows to have a height never gives it
    // one. Handing it the sheet's own height breaks the deadlock -- and so does
    // any sheet taller than its contents, whose children expect to be handed
    // the room it has rather than to sit in a box the size of their text.
    const fillsSheet = !!props.scrollableRef || sheetDetents.some((detent) => detent !== 'auto');

    // The sheet insets a scrollable's content and a footer for the Android
    // navigation bar on its own, but leaves plain content on the bottom edge.
    const clearsNavigationBar = isAndroid && !props.scrollableRef && !props.footer;

    return (
      <RNTrueSheet
        ref={ref}
        detents={sheetDetents}
        presentation={presentation}
        backgroundStyle={[
          !isLiquidGlassAvailable && { backgroundColor: colors.background },
          backgroundStyle,
        ]}
        style={[
          fillsSheet && { flex: 1 },
          clearsNavigationBar && { paddingBottom: insets.bottom },
          style,
        ]}
        {...props}
      >
        {children}
      </RNTrueSheet>
    );
  },
);
TrueSheet.displayName = 'TrueSheet';

export { TrueSheetProps };

export default TrueSheet;

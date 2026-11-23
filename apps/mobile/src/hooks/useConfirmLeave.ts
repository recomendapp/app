import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';

type ConfirmLeaveOptions = {
  /** Whether leaving has to be confirmed, e.g. a form with unsaved changes. */
  enabled: boolean;
  title: string;
  message?: string;
  /** Leaves the screen. */
  confirmLabel: string;
  /** Stays on it. */
  cancelLabel: string;
};

/**
 * Asks before a screen is left, and leaves once the reader confirms.
 *
 * Confirming goes through `repeat()`, which disarms the prevention and
 * dispatches the action the callback was handed. Dispatching that action
 * without disarming first is caught by the guard again and asks for ever.
 *
 * `preventRemove` goes false in the same handler, as expo-router asks in so
 * many words: `repeat()` leaves the prevention down while the prop still says
 * to prevent, and it warns about exactly that. The flag is lifted again right
 * after, so a screen the action did not remove keeps its guard.
 */
export const useConfirmLeave = ({
  enabled,
  title,
  message,
  confirmLabel,
  cancelLabel,
}: ConfirmLeaveOptions) => {
  const { mode } = useTheme();
  const [isLeaving, setIsLeaving] = useState(false);

  usePreventRemove(enabled && !isLeaving, ({ repeat }) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel' },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => {
            setIsLeaving(true);
            repeat();
          },
        },
      ],
      { userInterfaceStyle: mode },
    );
  });

  useEffect(() => {
    if (!isLeaving) return;
    // The action has been dispatched by now: a screen it did not take away
    // gets its guard back, instead of staying unguarded for good.
    const armAgain = setTimeout(() => setIsLeaving(false), 0);
    return () => clearTimeout(armAgain);
  }, [isLeaving]);
};

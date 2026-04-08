import React, { useCallback, useMemo } from 'react';
import useBottomSheetStore from 'apps/mobile/src/stores/useBottomSheetStore';
import { Button } from 'apps/mobile/src/components/ui/Button';
import TrueSheet from 'apps/mobile/src/components/ui/TrueSheet';
import { BottomSheetProps } from '../BottomSheetManager';
import { useTranslations } from 'use-intl';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from 'apps/mobile/src/theme/globals';
import { View } from 'apps/mobile/src/components/ui/view';
import { useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { upperFirst } from 'lodash';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface BottomSheetSelectDateProps extends BottomSheetProps {
	defaultDate?: Date | null;
	onSave?: (newDate: Date) => Promise<void> | void;
	saveLabel?: string;
};

export const BottomSheetSelectDate = React.forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetSelectDateProps
>(({ id, defaultDate, onSave, saveLabel, ...props }, ref) => {
	const { colors } = useTheme();
	const closeSheet = useBottomSheetStore((state) => state.closeSheet);
	const t = useTranslations();
	const insets = useSafeAreaInsets();

	const footerHeight = useSharedValue(0);
	const [selectedDate, setSelectedDate] = React.useState<Date>(defaultDate || new Date());

	// Handlers
	const handleSave = useCallback(async () => {
		if (!selectedDate) return;
		if (onSave) {
			await onSave(selectedDate);
		}
		closeSheet(id);
	}, [closeSheet, id, onSave, selectedDate]);

	const footerOffsetStyle = useAnimatedStyle(() => ({
		height: footerHeight.value,
	}));

	return (
    <TrueSheet
	ref={ref}
	style={{
		gap: GAP,
		paddingTop: PADDING_VERTICAL * 2,
		paddingHorizontal: PADDING_HORIZONTAL,
	}}
	footer={
		<View
            style={{
              paddingBottom: insets.bottom,
              paddingLeft: insets.left + PADDING_HORIZONTAL,
              paddingRight: insets.right + PADDING_HORIZONTAL,
              paddingTop: PADDING_VERTICAL,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              borderTopWidth: 1,
            }}
          >
            <Button
              onLayout={(e) => {
                footerHeight.value = e.nativeEvent.layout.height;
              }}
			  disabled={!selectedDate}
			  variant='ghost'
              size="lg"
              onPress={handleSave}
            >
				{saveLabel || upperFirst(t('common.messages.save'))}
            </Button>
		</View>
	}
	{...props}
	>
		<RNDateTimePicker
		value={selectedDate}
		onChange={(e) => setSelectedDate(new Date(e.nativeEvent.timestamp))}
		display="spinner"
		/>
		<Animated.View style={footerOffsetStyle} />
    </TrueSheet>
  );
});
BottomSheetSelectDate.displayName = 'BottomSheetSelectDate';

import { useMediaPersonDetailsQuery } from "apps/mobile/src/api/medias/mediaQueries";
import BottomSheetPerson from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetPerson";
import ButtonPersonFollow from "apps/mobile/src/components/buttons/ButtonPersonFollow";
import { PersonHeader } from "apps/mobile/src/components/screens/person/PersonHeader";
import PersonWidgetFilms from "apps/mobile/src/components/screens/person/PersonWidgetFilms";
import PersonWidgetTvSeries from "apps/mobile/src/components/screens/person/PersonWidgetTvSeries";
import AnimatedStackScreen from "apps/mobile/src/components/ui/AnimatedStackScreen";
import { Button } from "apps/mobile/src/components/ui/Button";
import { Icons } from "apps/mobile/src/constants/Icons";
import tw from "apps/mobile/src/lib/tw";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { GAP, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import { useLocalSearchParams } from "expo-router";
import { upperFirst } from "lodash";
import { useCallback, useMemo } from "react";
import { View } from "react-native"
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useTranslations } from "use-intl";

const PersonScreen = () => {
	const t = useTranslations();
	const { person_id } = useLocalSearchParams<{ person_id: string }>();
	const { id: personId } = getIdFromSlug(person_id);
	const { bottomOffset, tabBarHeight } = useTheme();
	const { session } = useAuth();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	// Queries
	const {
		data: person,
		isLoading,
	} = useMediaPersonDetailsQuery({
		personId: personId,
	});
	const loading = useMemo(() => person === undefined || isLoading, [person, isLoading]);
	// SharedValue
	const headerHeight = useSharedValue(0);
	const scrollY = useSharedValue(0);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			'worklet';
			scrollY.value = event.contentOffset.y;
		},
	});

	const handleMenuPress = useCallback(() => {
		if (person) {
			openSheet(BottomSheetPerson, {
				person: person,
			})
		}
	}, [openSheet, person]);

	return (
	<>
		<AnimatedStackScreen
		options={{
			headerTitle: person?.name || '',
			headerTransparent: true,
			headerRight: () => (
				<View style={tw`flex-row items-center gap-1`}>
					{session && <ButtonPersonFollow personId={personId} />}
					<Button
					variant="ghost"
					size="icon"
					icon={Icons.EllipsisVertical}
					onPress={handleMenuPress}
					/>
				</View>
			),
			unstable_headerRightItems: (props) => [
				{
					type: "button",
					label: upperFirst(t('common.messages.menu')),
					onPress: handleMenuPress,
					icon: {
						name: "ellipsis",
						type: "sfSymbol",
					},
				}
			],
		}}
		scrollY={scrollY}
		triggerHeight={headerHeight}
		/>
		<Animated.ScrollView
		onScroll={scrollHandler}
		scrollToOverflowEnabled
		contentContainerStyle={[
			{
				paddingBottom: bottomOffset + PADDING_VERTICAL,
				gap: GAP,
			},
		]}
		scrollIndicatorInsets={{
			bottom: tabBarHeight,
		}}
		>
			<PersonHeader
			person={person}
			loading={loading}
			scrollY={scrollY}
			triggerHeight={headerHeight}
			/>
			{!loading && (
			<>
				<PersonWidgetFilms
				personId={personId}
				url={{
					pathname: `/person/[person_id]/films`,
					params: { person_id: personId }
				}}
				/>
				<PersonWidgetTvSeries
				personId={personId}
				url={{
					pathname: `/person/[person_id]/tv-series`,
					params: { person_id: personId }
				}}
				/>
			</>
			)}
		</Animated.ScrollView>
	</>
	);
};

export default PersonScreen;
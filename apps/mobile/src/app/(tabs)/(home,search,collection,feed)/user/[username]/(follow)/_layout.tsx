import { View } from "apps/mobile/src/components/ui/view";
import tw from "apps/mobile/src/lib/tw";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { createMaterialTopTabNavigator, MaterialTopTabNavigationEventMap, MaterialTopTabNavigationOptions } from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { Stack, useLocalSearchParams, withLayoutContext } from "expo-router";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { HeaderTitle } from "@react-navigation/elements";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useQuery } from "@tanstack/react-query";
import { userByUsernameOptions } from "@libs/query-client";

const Tab = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
	MaterialTopTabNavigationOptions,
	typeof Tab.Navigator,
	TabNavigationState<ParamListBase>,
	MaterialTopTabNavigationEventMap
>(Tab.Navigator);

const ProfileFollowLayout = () => {
	const { username } = useLocalSearchParams<{ username: string }>();
	const { data: profile } = useQuery(userByUsernameOptions({ username: username }));
	const { colors } = useTheme();
	const t = useTranslations();
	return (
	<>
		<Stack.Screen
		options={{
			title: profile ? `@${profile.username}` : '',
			headerTitle: (props) => (
				<View style={tw`flex-row items-center gap-1`}>
						<HeaderTitle {...props}>
						{profile ? `@${profile.username}` : ''}
						</HeaderTitle>
						{profile?.isPremium && <Icons.premium color={colors.accentBlue} size={14} />}
				</View>
			),
			headerBackButtonDisplayMode: 'minimal',
		}}
		
		/>
		<MaterialTopTabs
		initialRouteName="followers"
		screenOptions={{
			tabBarIndicatorStyle: {
				backgroundColor: colors.accentBlue,
			},
			tabBarLabelStyle: {
				color: colors.foreground,
			},
			tabBarStyle: {
				backgroundColor: colors.background
			}
		}}
		>
			<MaterialTopTabs.Screen name="followers" initialParams={{ username }} options={{ title: upperFirst(t('common.messages.follower_count', { count: profile?.followersCount || 0 })) }} />
			<MaterialTopTabs.Screen name="followees" initialParams={{ username }} options={{ title: upperFirst(t('common.messages.followee_count', { count: profile?.followingCount || 0 })) }} />
		</MaterialTopTabs>
	</>
	);
};

export default ProfileFollowLayout;

import { Button } from "apps/mobile/src/components/ui/Button";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import { Icons } from "apps/mobile/src/constants/Icons";
import tw from "apps/mobile/src/lib/tw";
import { Stack, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";

const NotificationsScreen = () => {
	const router = useRouter();
	const t = useTranslations();
	return (
	<>
		<Stack.Screen
		options={{
			headerRight: () => (
				<View style={[tw`flex-row items-center`]}>
					<Button
					variant="ghost"
					icon={Icons.UserPlus}
					size="icon"
					onPress={() => router.push("/follow-requests")}
					/>
				</View>
			),
			unstable_headerRightItems: (props) => [
				{
					type: "button",
					label: upperFirst(t('common.messages.follow_requests')),
					onPress: () => router.push("/follow-requests"),
					tintColor: props.tintColor,
					icon: {
						name: "person.badge.plus",
						type: "sfSymbol",
					},
				},
			],
		}}
		/>
		<View>
			<Text textColor="muted" style={tw`text-center`}>Notifications system is deleted for now</Text>
		</View>
	</>
	)
};

export default NotificationsScreen;
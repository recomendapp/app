import { IconMediaRating } from "apps/mobile/src/components/medias/IconMediaRating";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import { forwardRef } from "react";
import { View } from "react-native";
import { useTranslations } from "use-intl";
import { Text } from "apps/mobile/src/components/ui/text";
import { LogMovie, LogTvSeries, UserSummary } from "@packages/api-js";

interface FeedUserLogProps
  extends React.ComponentProps<typeof View> {
	author: UserSummary;
	log: LogMovie | LogTvSeries;
}

const FeedUserLog = forwardRef<
	React.ComponentRef<typeof View>,
	FeedUserLogProps
>(({ author, log, style, ...props }, ref) => {
	const { colors } = useTheme();
	const t = useTranslations();
	return (
	  <View
	  ref={ref}
	  style={[
		tw`flex-row items-center gap-2`,
		style,
	  ]}
	  {...props}
	  >
		{log.review ? (
		  <>
			<Text>
			  {t.rich('pages.feed.actions.reviewed', {
				name: () => (
				  <Text style={tw`font-semibold`}>
					{author.username}
				  </Text>
				),
			  })}
			</Text>
		  </>
		) : (
		  <>
			{log.isLiked && log.rating ? (
			  <Text>
				{t.rich('pages.feed.actions.rated_liked', {
				  name: () => (
					<Text style={tw`font-semibold`}>
					  {author.username}
					</Text>
				  ),
				})}
			  </Text>
			) : log.isLiked && !log.rating ? (
			  <Text>
				{t.rich('pages.feed.actions.liked', {
					name: () => (
					  <Text style={tw`font-semibold`}>
						{author.username}
					  </Text>
					),
				})}
			  </Text>
			) : !log.isLiked && log.rating ? (
			  <Text>
				{t.rich('pages.feed.actions.rated', {
				  name: () => (
					<Text style={tw`font-semibold`}>
					  {author.username}
					</Text>
				  ),
				})}
			  </Text>
			) : (
			  <Text>
				{t.rich('pages.feed.actions.watched', {
				  name: () => (
					<Text style={tw`font-semibold`}>
					  {author.username}
					</Text>
				  ),
				})}
			  </Text>
			)}
		  	{log.rating && (
				<IconMediaRating
				rating={log.rating}
				className="inline-flex"
				/>
			)}
			{log.isLiked && (
				<Icons.like
				size={24}
				color={colors.background}
				fill={colors.accentPink}
				/>
			)}
		  </>
		)}
	  </View>
	);
});
FeedUserLog.displayName = "FeedUserLog";

export default FeedUserLog;
import { ProfileTvSeries } from "apps/mobile/src/components/screens/user/tv-series/ProfileTvSeries";
import { useLocalSearchParams } from "expo-router";

const ProfileTvSeriesScreen = () => {
	const { username, tv_series_id } = useLocalSearchParams<{ username: string, tv_series_id: string }>();
	return <ProfileTvSeries username={username} tvSeriesId={parseInt(tv_series_id)} />;
};

export default ProfileTvSeriesScreen;
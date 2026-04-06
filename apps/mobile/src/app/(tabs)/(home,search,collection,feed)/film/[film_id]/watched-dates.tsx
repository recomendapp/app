import { userMovieWatchedDatesInfiniteOptions } from "@libs/query-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Text } from "apps/mobile/src/components/ui/text"
import { View } from "apps/mobile/src/components/ui/view"
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import { useLocalSearchParams } from "expo-router";

const FilmWatchedDatesScreen = () => {
	const { user } = useAuth();
	const { film_id } = useLocalSearchParams<{ film_id: string }>();
	const { id: movieId } = getIdFromSlug(film_id);
	const {
		data: wachedDates,
	} = useInfiniteQuery(userMovieWatchedDatesInfiniteOptions({
		userId: user?.id,
		movieId: movieId,
	}));
	return (
		<View>
			<Text>COOL</Text>
		</View>
	);
}

export default FilmWatchedDatesScreen;
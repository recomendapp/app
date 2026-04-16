import { ProfileFilm } from "apps/mobile/src/components/screens/user/film/ProfileFilm";
import { useLocalSearchParams } from "expo-router";

const ProfileFilmScreen = () => {
	const { username, film_id } = useLocalSearchParams<{ username: string, film_id: string }>();
	return <ProfileFilm username={username} movieId={parseInt(film_id)} />;
};

export default ProfileFilmScreen;
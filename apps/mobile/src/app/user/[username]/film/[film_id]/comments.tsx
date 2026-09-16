import { ReviewMovieCommentsScreen } from '../../../../../components/screens/review/comments/ReviewMovieCommentsScreen';
import { useLocalSearchParams } from 'expo-router';

const FilmCommentsScreen = () => {
  const { username, film_id } = useLocalSearchParams<{ username: string; film_id: string }>();
  return <ReviewMovieCommentsScreen username={username} movieId={parseInt(film_id)} />;
};

export default FilmCommentsScreen;

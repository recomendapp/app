import { ReviewTvSeriesCommentsScreen } from '../../../../../components/screens/review/comments/ReviewTvSeriesCommentsScreen';
import { useLocalSearchParams } from 'expo-router';

const TvSeriesCommentsScreen = () => {
  const { username, tv_series_id } = useLocalSearchParams<{
    username: string;
    tv_series_id: string;
  }>();
  return <ReviewTvSeriesCommentsScreen username={username} tvSeriesId={parseInt(tv_series_id)} />;
};

export default TvSeriesCommentsScreen;

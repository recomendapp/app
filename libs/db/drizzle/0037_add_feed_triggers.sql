-- Custom SQL migration file, put your code below! --

CREATE OR REPLACE FUNCTION public.sync_feed()
RETURNS TRIGGER AS $$
DECLARE
  v_activity_type public.feed_type := TG_ARGV[0];
BEGIN
  IF v_activity_type IS NULL THEN
    RAISE EXCEPTION 'Activity type must be provided.';
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.feed (user_id, activity_type, activity_id, created_at)
    VALUES (NEW.user_id, v_activity_type, NEW.id, NEW.created_at)
    ON CONFLICT DO NOTHING;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.feed
    WHERE activity_type = v_activity_type AND activity_id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- log_movie
DROP TRIGGER IF EXISTS sync_feed_log_movie_trigger ON public.log_movie;
CREATE TRIGGER sync_feed_log_movie_trigger
AFTER INSERT OR DELETE ON public.log_movie
FOR EACH ROW EXECUTE FUNCTION public.sync_feed('log_movie');

-- log_tv_series
DROP TRIGGER IF EXISTS sync_feed_log_tv_series_trigger ON public.log_tv_series;
CREATE TRIGGER sync_feed_log_tv_series_trigger
AFTER INSERT OR DELETE ON public.log_tv_series
FOR EACH ROW EXECUTE FUNCTION public.sync_feed('log_tv_series');

-- playlist_like
DROP TRIGGER IF EXISTS sync_feed_playlist_like_trigger ON public.playlist_like;
CREATE TRIGGER sync_feed_playlist_like_trigger
AFTER INSERT OR DELETE ON public.playlist_like
FOR EACH ROW EXECUTE FUNCTION public.sync_feed('playlist_like');

-- review_movie_like
DROP TRIGGER IF EXISTS sync_feed_review_movie_like_trigger ON public.review_movie_like;
CREATE TRIGGER sync_feed_review_movie_like_trigger
AFTER INSERT OR DELETE ON public.review_movie_like
FOR EACH ROW EXECUTE FUNCTION public.sync_feed('review_movie_like');

-- review_tv_series_like
DROP TRIGGER IF EXISTS sync_feed_review_tv_series_like_trigger ON public.review_tv_series_like;
CREATE TRIGGER sync_feed_review_tv_series_like_trigger
AFTER INSERT OR DELETE ON public.review_tv_series_like
FOR EACH ROW EXECUTE FUNCTION public.sync_feed('review_tv_series_like');
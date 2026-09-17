-- Custom SQL migration file, put your code below! --

-- See 0074_batch_follow_playlist_counters_triggers.sql for why these moved
-- from FOR EACH ROW to FOR EACH STATEMENT with transition tables, and why
-- each relationship is separate single-event triggers instead of one
-- combined one. Not a counter, but the same cascade cost applies: deleting
-- a popular playlist fired one DELETE FROM feed per like it had. This one
-- was already INSERT/DELETE only (no UPDATE), so it's two triggers, not
-- three.

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
    SELECT user_id, v_activity_type, id, created_at
    FROM new_rows
    ON CONFLICT DO NOTHING;
    RETURN NULL;

  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.feed f
    USING old_rows o
    WHERE f.activity_type = v_activity_type AND f.activity_id = o.id;
    RETURN NULL;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- log_movie
DROP TRIGGER IF EXISTS sync_feed_log_movie_trigger ON public.log_movie;
DROP TRIGGER IF EXISTS sync_feed_log_movie_insert_trigger ON public.log_movie;
DROP TRIGGER IF EXISTS sync_feed_log_movie_delete_trigger ON public.log_movie;

CREATE TRIGGER sync_feed_log_movie_insert_trigger
AFTER INSERT ON public.log_movie
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('log_movie');

CREATE TRIGGER sync_feed_log_movie_delete_trigger
AFTER DELETE ON public.log_movie
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('log_movie');

-- log_tv_series
DROP TRIGGER IF EXISTS sync_feed_log_tv_series_trigger ON public.log_tv_series;
DROP TRIGGER IF EXISTS sync_feed_log_tv_series_insert_trigger ON public.log_tv_series;
DROP TRIGGER IF EXISTS sync_feed_log_tv_series_delete_trigger ON public.log_tv_series;

CREATE TRIGGER sync_feed_log_tv_series_insert_trigger
AFTER INSERT ON public.log_tv_series
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('log_tv_series');

CREATE TRIGGER sync_feed_log_tv_series_delete_trigger
AFTER DELETE ON public.log_tv_series
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('log_tv_series');

-- playlist_like
DROP TRIGGER IF EXISTS sync_feed_playlist_like_trigger ON public.playlist_like;
DROP TRIGGER IF EXISTS sync_feed_playlist_like_insert_trigger ON public.playlist_like;
DROP TRIGGER IF EXISTS sync_feed_playlist_like_delete_trigger ON public.playlist_like;

CREATE TRIGGER sync_feed_playlist_like_insert_trigger
AFTER INSERT ON public.playlist_like
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('playlist_like');

CREATE TRIGGER sync_feed_playlist_like_delete_trigger
AFTER DELETE ON public.playlist_like
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('playlist_like');

-- review_movie_like
DROP TRIGGER IF EXISTS sync_feed_review_movie_like_trigger ON public.review_movie_like;
DROP TRIGGER IF EXISTS sync_feed_review_movie_like_insert_trigger ON public.review_movie_like;
DROP TRIGGER IF EXISTS sync_feed_review_movie_like_delete_trigger ON public.review_movie_like;

CREATE TRIGGER sync_feed_review_movie_like_insert_trigger
AFTER INSERT ON public.review_movie_like
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('review_movie_like');

CREATE TRIGGER sync_feed_review_movie_like_delete_trigger
AFTER DELETE ON public.review_movie_like
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('review_movie_like');

-- review_tv_series_like
DROP TRIGGER IF EXISTS sync_feed_review_tv_series_like_trigger ON public.review_tv_series_like;
DROP TRIGGER IF EXISTS sync_feed_review_tv_series_like_insert_trigger ON public.review_tv_series_like;
DROP TRIGGER IF EXISTS sync_feed_review_tv_series_like_delete_trigger ON public.review_tv_series_like;

CREATE TRIGGER sync_feed_review_tv_series_like_insert_trigger
AFTER INSERT ON public.review_tv_series_like
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('review_tv_series_like');

CREATE TRIGGER sync_feed_review_tv_series_like_delete_trigger
AFTER DELETE ON public.review_tv_series_like
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.sync_feed('review_tv_series_like');

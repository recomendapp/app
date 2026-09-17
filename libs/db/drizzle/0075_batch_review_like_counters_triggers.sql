-- Custom SQL migration file, put your code below! --

-- See 0074_batch_follow_playlist_counters_triggers.sql for why these moved
-- from FOR EACH ROW to FOR EACH STATEMENT with transition tables, and why
-- each relationship is three single-event triggers instead of one combined
-- one (Postgres doesn't allow a transition table on a multi-event trigger).

-- Review movie like (review_movie.likes_count)
CREATE OR REPLACE FUNCTION count_review_movie_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_movie r
        SET likes_count = GREATEST(r.likes_count - sub.cnt, 0)
        FROM (
            SELECT review_id, count(*) AS cnt
            FROM old_rows
            GROUP BY review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_movie r
        SET likes_count = r.likes_count + sub.cnt
        FROM (
            SELECT review_id, count(*) AS cnt
            FROM new_rows
            GROUP BY review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE review_movie r
        SET likes_count = GREATEST(r.likes_count - sub.cnt, 0)
        FROM (
            SELECT o.review_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.review_id <> n.review_id
            GROUP BY o.review_id
        ) sub
        WHERE r.id = sub.review_id;

        UPDATE review_movie r
        SET likes_count = r.likes_count + sub.cnt
        FROM (
            SELECT n.review_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.review_id <> n.review_id
            GROUP BY n.review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_movie_like_trigger ON review_movie_like;
DROP TRIGGER IF EXISTS count_review_movie_like_insert_trigger ON review_movie_like;
DROP TRIGGER IF EXISTS count_review_movie_like_update_trigger ON review_movie_like;
DROP TRIGGER IF EXISTS count_review_movie_like_delete_trigger ON review_movie_like;

CREATE TRIGGER count_review_movie_like_insert_trigger
AFTER INSERT ON review_movie_like
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_like();

CREATE TRIGGER count_review_movie_like_update_trigger
AFTER UPDATE ON review_movie_like
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_like();

CREATE TRIGGER count_review_movie_like_delete_trigger
AFTER DELETE ON review_movie_like
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_like();


-- Review tv series like (review_tv_series.likes_count)
CREATE OR REPLACE FUNCTION count_review_tv_series_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_tv_series r
        SET likes_count = GREATEST(r.likes_count - sub.cnt, 0)
        FROM (
            SELECT review_id, count(*) AS cnt
            FROM old_rows
            GROUP BY review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_tv_series r
        SET likes_count = r.likes_count + sub.cnt
        FROM (
            SELECT review_id, count(*) AS cnt
            FROM new_rows
            GROUP BY review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE review_tv_series r
        SET likes_count = GREATEST(r.likes_count - sub.cnt, 0)
        FROM (
            SELECT o.review_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.review_id <> n.review_id
            GROUP BY o.review_id
        ) sub
        WHERE r.id = sub.review_id;

        UPDATE review_tv_series r
        SET likes_count = r.likes_count + sub.cnt
        FROM (
            SELECT n.review_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.review_id <> n.review_id
            GROUP BY n.review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_tv_series_like_trigger ON review_tv_series_like;
DROP TRIGGER IF EXISTS count_review_tv_series_like_insert_trigger ON review_tv_series_like;
DROP TRIGGER IF EXISTS count_review_tv_series_like_update_trigger ON review_tv_series_like;
DROP TRIGGER IF EXISTS count_review_tv_series_like_delete_trigger ON review_tv_series_like;

CREATE TRIGGER count_review_tv_series_like_insert_trigger
AFTER INSERT ON review_tv_series_like
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_like();

CREATE TRIGGER count_review_tv_series_like_update_trigger
AFTER UPDATE ON review_tv_series_like
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_like();

CREATE TRIGGER count_review_tv_series_like_delete_trigger
AFTER DELETE ON review_tv_series_like
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_like();

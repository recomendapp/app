-- Custom SQL migration file, put your code below! --

-- See 0074_batch_follow_playlist_counters_triggers.sql for why these moved
-- from FOR EACH ROW to FOR EACH STATEMENT with transition tables, and why
-- each relationship is three single-event triggers instead of one combined
-- one. This matters even more here: deleting one popular review cascades
-- through every one of its comments AND every like on every one of those
-- comments in a single transaction.

-- Review movie comment (comments_count on review_movie)
CREATE OR REPLACE FUNCTION count_review_movie_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_movie r
        SET comments_count = GREATEST(r.comments_count - sub.cnt, 0)
        FROM (
            SELECT review_id, count(*) AS cnt
            FROM old_rows
            WHERE deleted_at IS NULL
            GROUP BY review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_movie r
        SET comments_count = r.comments_count + sub.cnt
        FROM (
            SELECT review_id, count(*) AS cnt
            FROM new_rows
            GROUP BY review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE review_movie r
        SET comments_count = GREATEST(r.comments_count - sub.cnt, 0)
        FROM (
            SELECT o.review_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.deleted_at IS NULL AND n.deleted_at IS NOT NULL
            GROUP BY o.review_id
        ) sub
        WHERE r.id = sub.review_id;

        UPDATE review_movie r
        SET comments_count = r.comments_count + sub.cnt
        FROM (
            SELECT n.review_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.deleted_at IS NOT NULL AND n.deleted_at IS NULL
            GROUP BY n.review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_movie_comment_trigger ON review_movie_comment;
DROP TRIGGER IF EXISTS count_review_movie_comment_insert_trigger ON review_movie_comment;
DROP TRIGGER IF EXISTS count_review_movie_comment_update_trigger ON review_movie_comment;
DROP TRIGGER IF EXISTS count_review_movie_comment_delete_trigger ON review_movie_comment;

CREATE TRIGGER count_review_movie_comment_insert_trigger
AFTER INSERT ON review_movie_comment
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment();

CREATE TRIGGER count_review_movie_comment_update_trigger
AFTER UPDATE ON review_movie_comment
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment();

CREATE TRIGGER count_review_movie_comment_delete_trigger
AFTER DELETE ON review_movie_comment
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment();


-- Review movie comment reply (replies_count on parent comment, only if parent_id is set)
--
-- This one updates the SAME table (review_movie_comment) the trigger fires
-- on, so every branch is wrapped in an EXISTS check against the transition
-- table before issuing the UPDATE. Statement-level AFTER triggers fire on
-- every statement regardless of how many rows it affects (unlike row-level
-- ones, which simply never fire on a 0-row match) - an unconditional UPDATE
-- here would keep re-firing this same trigger on itself forever (stack
-- depth limit exceeded), even though each recursive call's subquery would
-- eventually match 0 rows. The EXISTS guard stops it from issuing that
-- UPDATE at all once there's nothing left to do.
CREATE OR REPLACE FUNCTION count_review_movie_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF EXISTS (SELECT 1 FROM old_rows WHERE parent_id IS NOT NULL AND deleted_at IS NULL) THEN
            UPDATE review_movie_comment c
            SET replies_count = GREATEST(c.replies_count - sub.cnt, 0)
            FROM (
                SELECT parent_id, count(*) AS cnt
                FROM old_rows
                WHERE parent_id IS NOT NULL AND deleted_at IS NULL
                GROUP BY parent_id
            ) sub
            WHERE c.id = sub.parent_id;
        END IF;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        IF EXISTS (SELECT 1 FROM new_rows WHERE parent_id IS NOT NULL) THEN
            UPDATE review_movie_comment c
            SET replies_count = c.replies_count + sub.cnt
            FROM (
                SELECT parent_id, count(*) AS cnt
                FROM new_rows
                WHERE parent_id IS NOT NULL
                GROUP BY parent_id
            ) sub
            WHERE c.id = sub.parent_id;
        END IF;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        IF EXISTS (
            SELECT 1 FROM old_rows o JOIN new_rows n ON n.id = o.id
            WHERE n.parent_id IS NOT NULL AND o.deleted_at IS NULL AND n.deleted_at IS NOT NULL
        ) THEN
            UPDATE review_movie_comment c
            SET replies_count = GREATEST(c.replies_count - sub.cnt, 0)
            FROM (
                SELECT n.parent_id, count(*) AS cnt
                FROM old_rows o
                JOIN new_rows n ON n.id = o.id
                WHERE n.parent_id IS NOT NULL AND o.deleted_at IS NULL AND n.deleted_at IS NOT NULL
                GROUP BY n.parent_id
            ) sub
            WHERE c.id = sub.parent_id;
        END IF;

        IF EXISTS (
            SELECT 1 FROM old_rows o JOIN new_rows n ON n.id = o.id
            WHERE n.parent_id IS NOT NULL AND o.deleted_at IS NOT NULL AND n.deleted_at IS NULL
        ) THEN
            UPDATE review_movie_comment c
            SET replies_count = c.replies_count + sub.cnt
            FROM (
                SELECT n.parent_id, count(*) AS cnt
                FROM old_rows o
                JOIN new_rows n ON n.id = o.id
                WHERE n.parent_id IS NOT NULL AND o.deleted_at IS NOT NULL AND n.deleted_at IS NULL
                GROUP BY n.parent_id
            ) sub
            WHERE c.id = sub.parent_id;
        END IF;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_movie_comment_reply_trigger ON review_movie_comment;
DROP TRIGGER IF EXISTS count_review_movie_comment_reply_insert_trigger ON review_movie_comment;
DROP TRIGGER IF EXISTS count_review_movie_comment_reply_update_trigger ON review_movie_comment;
DROP TRIGGER IF EXISTS count_review_movie_comment_reply_delete_trigger ON review_movie_comment;

CREATE TRIGGER count_review_movie_comment_reply_insert_trigger
AFTER INSERT ON review_movie_comment
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment_reply();

CREATE TRIGGER count_review_movie_comment_reply_update_trigger
AFTER UPDATE ON review_movie_comment
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment_reply();

CREATE TRIGGER count_review_movie_comment_reply_delete_trigger
AFTER DELETE ON review_movie_comment
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment_reply();


-- Review movie comment like (likes_count on review_movie_comment)
CREATE OR REPLACE FUNCTION count_review_movie_comment_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_movie_comment c
        SET likes_count = GREATEST(c.likes_count - sub.cnt, 0)
        FROM (
            SELECT comment_id, count(*) AS cnt
            FROM old_rows
            GROUP BY comment_id
        ) sub
        WHERE c.id = sub.comment_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_movie_comment c
        SET likes_count = c.likes_count + sub.cnt
        FROM (
            SELECT comment_id, count(*) AS cnt
            FROM new_rows
            GROUP BY comment_id
        ) sub
        WHERE c.id = sub.comment_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE review_movie_comment c
        SET likes_count = GREATEST(c.likes_count - sub.cnt, 0)
        FROM (
            SELECT o.comment_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.comment_id <> n.comment_id
            GROUP BY o.comment_id
        ) sub
        WHERE c.id = sub.comment_id;

        UPDATE review_movie_comment c
        SET likes_count = c.likes_count + sub.cnt
        FROM (
            SELECT n.comment_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.comment_id <> n.comment_id
            GROUP BY n.comment_id
        ) sub
        WHERE c.id = sub.comment_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_movie_comment_like_trigger ON review_movie_comment_like;
DROP TRIGGER IF EXISTS count_review_movie_comment_like_insert_trigger ON review_movie_comment_like;
DROP TRIGGER IF EXISTS count_review_movie_comment_like_update_trigger ON review_movie_comment_like;
DROP TRIGGER IF EXISTS count_review_movie_comment_like_delete_trigger ON review_movie_comment_like;

CREATE TRIGGER count_review_movie_comment_like_insert_trigger
AFTER INSERT ON review_movie_comment_like
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment_like();

CREATE TRIGGER count_review_movie_comment_like_update_trigger
AFTER UPDATE ON review_movie_comment_like
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment_like();

CREATE TRIGGER count_review_movie_comment_like_delete_trigger
AFTER DELETE ON review_movie_comment_like
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_movie_comment_like();


-- Review tv series comment (comments_count on review_tv_series)
CREATE OR REPLACE FUNCTION count_review_tv_series_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_tv_series r
        SET comments_count = GREATEST(r.comments_count - sub.cnt, 0)
        FROM (
            SELECT review_id, count(*) AS cnt
            FROM old_rows
            WHERE deleted_at IS NULL
            GROUP BY review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_tv_series r
        SET comments_count = r.comments_count + sub.cnt
        FROM (
            SELECT review_id, count(*) AS cnt
            FROM new_rows
            GROUP BY review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE review_tv_series r
        SET comments_count = GREATEST(r.comments_count - sub.cnt, 0)
        FROM (
            SELECT o.review_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.deleted_at IS NULL AND n.deleted_at IS NOT NULL
            GROUP BY o.review_id
        ) sub
        WHERE r.id = sub.review_id;

        UPDATE review_tv_series r
        SET comments_count = r.comments_count + sub.cnt
        FROM (
            SELECT n.review_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.deleted_at IS NOT NULL AND n.deleted_at IS NULL
            GROUP BY n.review_id
        ) sub
        WHERE r.id = sub.review_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_tv_series_comment_trigger ON review_tv_series_comment;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_insert_trigger ON review_tv_series_comment;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_update_trigger ON review_tv_series_comment;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_delete_trigger ON review_tv_series_comment;

CREATE TRIGGER count_review_tv_series_comment_insert_trigger
AFTER INSERT ON review_tv_series_comment
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment();

CREATE TRIGGER count_review_tv_series_comment_update_trigger
AFTER UPDATE ON review_tv_series_comment
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment();

CREATE TRIGGER count_review_tv_series_comment_delete_trigger
AFTER DELETE ON review_tv_series_comment
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment();


-- Review tv series comment reply (replies_count on parent comment, only if parent_id is set)
-- Same self-referential-table caveat as count_review_movie_comment_reply above.
CREATE OR REPLACE FUNCTION count_review_tv_series_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF EXISTS (SELECT 1 FROM old_rows WHERE parent_id IS NOT NULL AND deleted_at IS NULL) THEN
            UPDATE review_tv_series_comment c
            SET replies_count = GREATEST(c.replies_count - sub.cnt, 0)
            FROM (
                SELECT parent_id, count(*) AS cnt
                FROM old_rows
                WHERE parent_id IS NOT NULL AND deleted_at IS NULL
                GROUP BY parent_id
            ) sub
            WHERE c.id = sub.parent_id;
        END IF;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        IF EXISTS (SELECT 1 FROM new_rows WHERE parent_id IS NOT NULL) THEN
            UPDATE review_tv_series_comment c
            SET replies_count = c.replies_count + sub.cnt
            FROM (
                SELECT parent_id, count(*) AS cnt
                FROM new_rows
                WHERE parent_id IS NOT NULL
                GROUP BY parent_id
            ) sub
            WHERE c.id = sub.parent_id;
        END IF;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        IF EXISTS (
            SELECT 1 FROM old_rows o JOIN new_rows n ON n.id = o.id
            WHERE n.parent_id IS NOT NULL AND o.deleted_at IS NULL AND n.deleted_at IS NOT NULL
        ) THEN
            UPDATE review_tv_series_comment c
            SET replies_count = GREATEST(c.replies_count - sub.cnt, 0)
            FROM (
                SELECT n.parent_id, count(*) AS cnt
                FROM old_rows o
                JOIN new_rows n ON n.id = o.id
                WHERE n.parent_id IS NOT NULL AND o.deleted_at IS NULL AND n.deleted_at IS NOT NULL
                GROUP BY n.parent_id
            ) sub
            WHERE c.id = sub.parent_id;
        END IF;

        IF EXISTS (
            SELECT 1 FROM old_rows o JOIN new_rows n ON n.id = o.id
            WHERE n.parent_id IS NOT NULL AND o.deleted_at IS NOT NULL AND n.deleted_at IS NULL
        ) THEN
            UPDATE review_tv_series_comment c
            SET replies_count = c.replies_count + sub.cnt
            FROM (
                SELECT n.parent_id, count(*) AS cnt
                FROM old_rows o
                JOIN new_rows n ON n.id = o.id
                WHERE n.parent_id IS NOT NULL AND o.deleted_at IS NOT NULL AND n.deleted_at IS NULL
                GROUP BY n.parent_id
            ) sub
            WHERE c.id = sub.parent_id;
        END IF;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_tv_series_comment_reply_trigger ON review_tv_series_comment;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_reply_insert_trigger ON review_tv_series_comment;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_reply_update_trigger ON review_tv_series_comment;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_reply_delete_trigger ON review_tv_series_comment;

CREATE TRIGGER count_review_tv_series_comment_reply_insert_trigger
AFTER INSERT ON review_tv_series_comment
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment_reply();

CREATE TRIGGER count_review_tv_series_comment_reply_update_trigger
AFTER UPDATE ON review_tv_series_comment
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment_reply();

CREATE TRIGGER count_review_tv_series_comment_reply_delete_trigger
AFTER DELETE ON review_tv_series_comment
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment_reply();


-- Review tv series comment like (likes_count on review_tv_series_comment)
CREATE OR REPLACE FUNCTION count_review_tv_series_comment_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_tv_series_comment c
        SET likes_count = GREATEST(c.likes_count - sub.cnt, 0)
        FROM (
            SELECT comment_id, count(*) AS cnt
            FROM old_rows
            GROUP BY comment_id
        ) sub
        WHERE c.id = sub.comment_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_tv_series_comment c
        SET likes_count = c.likes_count + sub.cnt
        FROM (
            SELECT comment_id, count(*) AS cnt
            FROM new_rows
            GROUP BY comment_id
        ) sub
        WHERE c.id = sub.comment_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE review_tv_series_comment c
        SET likes_count = GREATEST(c.likes_count - sub.cnt, 0)
        FROM (
            SELECT o.comment_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.comment_id <> n.comment_id
            GROUP BY o.comment_id
        ) sub
        WHERE c.id = sub.comment_id;

        UPDATE review_tv_series_comment c
        SET likes_count = c.likes_count + sub.cnt
        FROM (
            SELECT n.comment_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.comment_id <> n.comment_id
            GROUP BY n.comment_id
        ) sub
        WHERE c.id = sub.comment_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_tv_series_comment_like_trigger ON review_tv_series_comment_like;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_like_insert_trigger ON review_tv_series_comment_like;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_like_update_trigger ON review_tv_series_comment_like;
DROP TRIGGER IF EXISTS count_review_tv_series_comment_like_delete_trigger ON review_tv_series_comment_like;

CREATE TRIGGER count_review_tv_series_comment_like_insert_trigger
AFTER INSERT ON review_tv_series_comment_like
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment_like();

CREATE TRIGGER count_review_tv_series_comment_like_update_trigger
AFTER UPDATE ON review_tv_series_comment_like
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment_like();

CREATE TRIGGER count_review_tv_series_comment_like_delete_trigger
AFTER DELETE ON review_tv_series_comment_like
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_review_tv_series_comment_like();

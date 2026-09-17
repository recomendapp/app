-- Custom SQL migration file, put your code below! --

-- These replace the FOR EACH ROW versions from 0042_setup_counters_triggers.sql.
-- A row-level trigger fires once per affected row, including rows removed by
-- an ON DELETE CASCADE - so deleting one popular playlist with 50k saves fired
-- 50k individual UPDATEs, each looking up a playlist row that was itself
-- already deleted in the same cascade (a guaranteed no-op). Statement-level
-- triggers with transition tables (REFERENCING OLD/NEW TABLE) fire once per
-- statement - including once per cascade step - so the same delete becomes a
-- single UPDATE ... FROM (SELECT ... GROUP BY) aggregate instead of 50k.
--
-- Postgres doesn't allow a transition table on a trigger covering more than
-- one event (AFTER INSERT OR UPDATE OR DELETE), so each relationship below
-- is three single-event triggers sharing one TG_OP-branching function,
-- instead of the one combined trigger the row-level versions used.

-- Follow (profile.following_count / profile.followers_count)
CREATE OR REPLACE FUNCTION count_follow()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE profile p
        SET following_count = GREATEST(p.following_count - sub.cnt, 0)
        FROM (
            SELECT follower_id, count(*) AS cnt
            FROM old_rows
            WHERE status = 'accepted'
            GROUP BY follower_id
        ) sub
        WHERE p.id = sub.follower_id;

        UPDATE profile p
        SET followers_count = GREATEST(p.followers_count - sub.cnt, 0)
        FROM (
            SELECT following_id, count(*) AS cnt
            FROM old_rows
            WHERE status = 'accepted'
            GROUP BY following_id
        ) sub
        WHERE p.id = sub.following_id;

        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE profile p
        SET following_count = p.following_count + sub.cnt
        FROM (
            SELECT follower_id, count(*) AS cnt
            FROM new_rows
            WHERE status = 'accepted'
            GROUP BY follower_id
        ) sub
        WHERE p.id = sub.follower_id;

        UPDATE profile p
        SET followers_count = p.followers_count + sub.cnt
        FROM (
            SELECT following_id, count(*) AS cnt
            FROM new_rows
            WHERE status = 'accepted'
            GROUP BY following_id
        ) sub
        WHERE p.id = sub.following_id;

        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        -- accepted -> not accepted
        UPDATE profile p
        SET following_count = GREATEST(p.following_count - sub.cnt, 0)
        FROM (
            SELECT o.follower_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.follower_id = o.follower_id AND n.following_id = o.following_id
            WHERE o.status = 'accepted' AND n.status <> 'accepted'
            GROUP BY o.follower_id
        ) sub
        WHERE p.id = sub.follower_id;

        UPDATE profile p
        SET followers_count = GREATEST(p.followers_count - sub.cnt, 0)
        FROM (
            SELECT o.following_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.follower_id = o.follower_id AND n.following_id = o.following_id
            WHERE o.status = 'accepted' AND n.status <> 'accepted'
            GROUP BY o.following_id
        ) sub
        WHERE p.id = sub.following_id;

        -- not accepted -> accepted
        UPDATE profile p
        SET following_count = p.following_count + sub.cnt
        FROM (
            SELECT n.follower_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.follower_id = o.follower_id AND n.following_id = o.following_id
            WHERE o.status <> 'accepted' AND n.status = 'accepted'
            GROUP BY n.follower_id
        ) sub
        WHERE p.id = sub.follower_id;

        UPDATE profile p
        SET followers_count = p.followers_count + sub.cnt
        FROM (
            SELECT n.following_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.follower_id = o.follower_id AND n.following_id = o.following_id
            WHERE o.status <> 'accepted' AND n.status = 'accepted'
            GROUP BY n.following_id
        ) sub
        WHERE p.id = sub.following_id;

        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_follow_trigger ON follow;
DROP TRIGGER IF EXISTS count_follow_insert_trigger ON follow;
DROP TRIGGER IF EXISTS count_follow_update_trigger ON follow;
DROP TRIGGER IF EXISTS count_follow_delete_trigger ON follow;

CREATE TRIGGER count_follow_insert_trigger
AFTER INSERT ON follow
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_follow();

CREATE TRIGGER count_follow_update_trigger
AFTER UPDATE ON follow
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_follow();

CREATE TRIGGER count_follow_delete_trigger
AFTER DELETE ON follow
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_follow();


-- Playlist item (playlist.items_count)
CREATE OR REPLACE FUNCTION count_playlist_item()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE playlist p
        SET items_count = GREATEST(p.items_count - sub.cnt, 0)
        FROM (
            SELECT playlist_id, count(*) AS cnt
            FROM old_rows
            GROUP BY playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE playlist p
        SET items_count = p.items_count + sub.cnt
        FROM (
            SELECT playlist_id, count(*) AS cnt
            FROM new_rows
            GROUP BY playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE playlist p
        SET items_count = GREATEST(p.items_count - sub.cnt, 0)
        FROM (
            SELECT o.playlist_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.playlist_id <> n.playlist_id
            GROUP BY o.playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;

        UPDATE playlist p
        SET items_count = p.items_count + sub.cnt
        FROM (
            SELECT n.playlist_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.playlist_id <> n.playlist_id
            GROUP BY n.playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_playlist_item_trigger ON playlist_item;
DROP TRIGGER IF EXISTS count_playlist_item_insert_trigger ON playlist_item;
DROP TRIGGER IF EXISTS count_playlist_item_update_trigger ON playlist_item;
DROP TRIGGER IF EXISTS count_playlist_item_delete_trigger ON playlist_item;

CREATE TRIGGER count_playlist_item_insert_trigger
AFTER INSERT ON playlist_item
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_item();

CREATE TRIGGER count_playlist_item_update_trigger
AFTER UPDATE ON playlist_item
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_item();

CREATE TRIGGER count_playlist_item_delete_trigger
AFTER DELETE ON playlist_item
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_item();


-- Playlist like (playlist.likes_count)
CREATE OR REPLACE FUNCTION count_playlist_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE playlist p
        SET likes_count = GREATEST(p.likes_count - sub.cnt, 0)
        FROM (
            SELECT playlist_id, count(*) AS cnt
            FROM old_rows
            GROUP BY playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE playlist p
        SET likes_count = p.likes_count + sub.cnt
        FROM (
            SELECT playlist_id, count(*) AS cnt
            FROM new_rows
            GROUP BY playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE playlist p
        SET likes_count = GREATEST(p.likes_count - sub.cnt, 0)
        FROM (
            SELECT o.playlist_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.playlist_id <> n.playlist_id
            GROUP BY o.playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;

        UPDATE playlist p
        SET likes_count = p.likes_count + sub.cnt
        FROM (
            SELECT n.playlist_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.playlist_id <> n.playlist_id
            GROUP BY n.playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_playlist_like_trigger ON playlist_like;
DROP TRIGGER IF EXISTS count_playlist_like_insert_trigger ON playlist_like;
DROP TRIGGER IF EXISTS count_playlist_like_update_trigger ON playlist_like;
DROP TRIGGER IF EXISTS count_playlist_like_delete_trigger ON playlist_like;

CREATE TRIGGER count_playlist_like_insert_trigger
AFTER INSERT ON playlist_like
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_like();

CREATE TRIGGER count_playlist_like_update_trigger
AFTER UPDATE ON playlist_like
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_like();

CREATE TRIGGER count_playlist_like_delete_trigger
AFTER DELETE ON playlist_like
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_like();


-- Playlist saved (playlist.saved_count)
CREATE OR REPLACE FUNCTION count_playlist_saved()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE playlist p
        SET saved_count = GREATEST(p.saved_count - sub.cnt, 0)
        FROM (
            SELECT playlist_id, count(*) AS cnt
            FROM old_rows
            GROUP BY playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;

    ELSIF TG_OP = 'INSERT' THEN
        UPDATE playlist p
        SET saved_count = p.saved_count + sub.cnt
        FROM (
            SELECT playlist_id, count(*) AS cnt
            FROM new_rows
            GROUP BY playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE playlist p
        SET saved_count = GREATEST(p.saved_count - sub.cnt, 0)
        FROM (
            SELECT o.playlist_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.playlist_id <> n.playlist_id
            GROUP BY o.playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;

        UPDATE playlist p
        SET saved_count = p.saved_count + sub.cnt
        FROM (
            SELECT n.playlist_id, count(*) AS cnt
            FROM old_rows o
            JOIN new_rows n ON n.id = o.id
            WHERE o.playlist_id <> n.playlist_id
            GROUP BY n.playlist_id
        ) sub
        WHERE p.id = sub.playlist_id;
        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_playlist_saved_trigger ON playlist_saved;
DROP TRIGGER IF EXISTS count_playlist_saved_insert_trigger ON playlist_saved;
DROP TRIGGER IF EXISTS count_playlist_saved_update_trigger ON playlist_saved;
DROP TRIGGER IF EXISTS count_playlist_saved_delete_trigger ON playlist_saved;

CREATE TRIGGER count_playlist_saved_insert_trigger
AFTER INSERT ON playlist_saved
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_saved();

CREATE TRIGGER count_playlist_saved_update_trigger
AFTER UPDATE ON playlist_saved
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_saved();

CREATE TRIGGER count_playlist_saved_delete_trigger
AFTER DELETE ON playlist_saved
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION count_playlist_saved();

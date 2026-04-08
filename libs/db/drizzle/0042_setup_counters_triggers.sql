-- Custom SQL migration file, put your code below! --

-- Follow
CREATE OR REPLACE FUNCTION count_follow()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'accepted' THEN
            UPDATE profile SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
            UPDATE profile SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
        END IF;
        RETURN OLD;

    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.status = 'accepted' THEN
            UPDATE profile SET following_count = following_count + 1 WHERE id = NEW.follower_id;
            UPDATE profile SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.follower_id = NEW.follower_id AND OLD.following_id = NEW.following_id AND OLD.status = NEW.status THEN
            RETURN NEW;
        END IF;

        IF OLD.status = 'accepted' THEN
            UPDATE profile SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
            UPDATE profile SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
        END IF;

        IF NEW.status = 'accepted' THEN
            UPDATE profile SET following_count = following_count + 1 WHERE id = NEW.follower_id;
            UPDATE profile SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_follow_trigger ON follow;
CREATE TRIGGER count_follow_trigger
AFTER INSERT OR UPDATE OR DELETE ON follow
FOR EACH ROW EXECUTE FUNCTION count_follow();


-- Playlist item
CREATE OR REPLACE FUNCTION count_playlist_item()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE playlist SET items_count = GREATEST(items_count - 1, 0) WHERE id = OLD.playlist_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE playlist SET items_count = items_count + 1 WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.playlist_id <> NEW.playlist_id THEN
            UPDATE playlist SET items_count = GREATEST(items_count - 1, 0) WHERE id = OLD.playlist_id;
            UPDATE playlist SET items_count = items_count + 1 WHERE id = NEW.playlist_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_playlist_item_trigger ON playlist_item;
CREATE TRIGGER count_playlist_item_trigger
AFTER INSERT OR UPDATE OR DELETE ON playlist_item
FOR EACH ROW EXECUTE FUNCTION count_playlist_item();


-- Playlist like
CREATE OR REPLACE FUNCTION count_playlist_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE playlist SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.playlist_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE playlist SET likes_count = likes_count + 1 WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.playlist_id <> NEW.playlist_id THEN
            UPDATE playlist SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.playlist_id;
            UPDATE playlist SET likes_count = likes_count + 1 WHERE id = NEW.playlist_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_playlist_like_trigger ON playlist_like;
CREATE TRIGGER count_playlist_like_trigger
AFTER INSERT OR UPDATE OR DELETE ON playlist_like
FOR EACH ROW EXECUTE FUNCTION count_playlist_like();


-- Playlist saved
CREATE OR REPLACE FUNCTION count_playlist_saved()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE playlist SET saved_count = GREATEST(saved_count - 1, 0) WHERE id = OLD.playlist_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE playlist SET saved_count = saved_count + 1 WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.playlist_id <> NEW.playlist_id THEN
            UPDATE playlist SET saved_count = GREATEST(saved_count - 1, 0) WHERE id = OLD.playlist_id;
            UPDATE playlist SET saved_count = saved_count + 1 WHERE id = NEW.playlist_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_playlist_saved_trigger ON playlist_saved;
CREATE TRIGGER count_playlist_saved_trigger
AFTER INSERT OR UPDATE OR DELETE ON playlist_saved
FOR EACH ROW EXECUTE FUNCTION count_playlist_saved();

-- Review movie like
CREATE OR REPLACE FUNCTION count_review_movie_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_movie SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.review_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_movie SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.review_id <> NEW.review_id THEN
            UPDATE review_movie SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.review_id;
            UPDATE review_movie SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_movie_like_trigger ON review_movie_like;
CREATE TRIGGER count_review_movie_like_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_movie_like
FOR EACH ROW EXECUTE FUNCTION count_review_movie_like();

-- Review tv series like
CREATE OR REPLACE FUNCTION count_review_tv_series_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_tv_series SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.review_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_tv_series SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.review_id <> NEW.review_id THEN
            UPDATE review_tv_series SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.review_id;
            UPDATE review_tv_series SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_tv_series_like_trigger ON review_tv_series_like;
CREATE TRIGGER count_review_tv_series_like_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_tv_series_like
FOR EACH ROW EXECUTE FUNCTION count_review_tv_series_like();
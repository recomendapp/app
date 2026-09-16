-- Custom SQL migration file, put your code below! --

-- Review movie comment (comments_count on review_movie)
CREATE OR REPLACE FUNCTION count_review_movie_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.deleted_at IS NULL THEN
            UPDATE review_movie SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.review_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_movie SET comments_count = comments_count + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            UPDATE review_movie SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = NEW.review_id;
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            UPDATE review_movie SET comments_count = comments_count + 1 WHERE id = NEW.review_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_movie_comment_trigger ON review_movie_comment;
CREATE TRIGGER count_review_movie_comment_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_movie_comment
FOR EACH ROW EXECUTE FUNCTION count_review_movie_comment();


-- Review movie comment reply (replies_count on parent comment, only if parent_id is set)
CREATE OR REPLACE FUNCTION count_review_movie_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.parent_id IS NOT NULL AND OLD.deleted_at IS NULL THEN
            UPDATE review_movie_comment SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.parent_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE review_movie_comment SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.parent_id IS NOT NULL THEN
            IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                UPDATE review_movie_comment SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = NEW.parent_id;
            ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
                UPDATE review_movie_comment SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_movie_comment_reply_trigger ON review_movie_comment;
CREATE TRIGGER count_review_movie_comment_reply_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_movie_comment
FOR EACH ROW EXECUTE FUNCTION count_review_movie_comment_reply();


-- Review movie comment like (likes_count on review_movie_comment)
CREATE OR REPLACE FUNCTION count_review_movie_comment_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_movie_comment SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_movie_comment SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.comment_id <> NEW.comment_id THEN
            UPDATE review_movie_comment SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
            UPDATE review_movie_comment SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_movie_comment_like_trigger ON review_movie_comment_like;
CREATE TRIGGER count_review_movie_comment_like_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_movie_comment_like
FOR EACH ROW EXECUTE FUNCTION count_review_movie_comment_like();


-- Review tv series comment (comments_count on review_tv_series)
CREATE OR REPLACE FUNCTION count_review_tv_series_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.deleted_at IS NULL THEN
            UPDATE review_tv_series SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.review_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_tv_series SET comments_count = comments_count + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            UPDATE review_tv_series SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = NEW.review_id;
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            UPDATE review_tv_series SET comments_count = comments_count + 1 WHERE id = NEW.review_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_tv_series_comment_trigger ON review_tv_series_comment;
CREATE TRIGGER count_review_tv_series_comment_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_tv_series_comment
FOR EACH ROW EXECUTE FUNCTION count_review_tv_series_comment();


-- Review tv series comment reply (replies_count on parent comment, only if parent_id is set)
CREATE OR REPLACE FUNCTION count_review_tv_series_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.parent_id IS NOT NULL AND OLD.deleted_at IS NULL THEN
            UPDATE review_tv_series_comment SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.parent_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE review_tv_series_comment SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.parent_id IS NOT NULL THEN
            IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                UPDATE review_tv_series_comment SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = NEW.parent_id;
            ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
                UPDATE review_tv_series_comment SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_tv_series_comment_reply_trigger ON review_tv_series_comment;
CREATE TRIGGER count_review_tv_series_comment_reply_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_tv_series_comment
FOR EACH ROW EXECUTE FUNCTION count_review_tv_series_comment_reply();


-- Review tv series comment like (likes_count on review_tv_series_comment)
CREATE OR REPLACE FUNCTION count_review_tv_series_comment_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE review_tv_series_comment SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE review_tv_series_comment SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.comment_id <> NEW.comment_id THEN
            UPDATE review_tv_series_comment SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
            UPDATE review_tv_series_comment SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS count_review_tv_series_comment_like_trigger ON review_tv_series_comment_like;
CREATE TRIGGER count_review_tv_series_comment_like_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_tv_series_comment_like
FOR EACH ROW EXECUTE FUNCTION count_review_tv_series_comment_like();

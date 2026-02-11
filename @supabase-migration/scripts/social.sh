#!/bin/bash
set -e

# Charger les variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

SOURCE_DB=$SOURCE_DATABASE_URL
TARGET_DB=$TARGET_DATABASE_URL

# Fonction helper (sans désactivation des contraintes, car peu de données)
migrate_query_to_table() {
    local NAME=$1
    local SOURCE_SQL=$2
    local TARGET_TABLE=$3
    local TARGET_COLS=$4
    local APPEND_MODE=$5 # Si "true", on ne fait pas de TRUNCATE

    echo "---------------------------------------------------"
    echo "🚀 Migration : $NAME -> $TARGET_TABLE"
    
    if [ "$APPEND_MODE" != "true" ]; then
        echo "   🧹 Truncate cible..."
        psql "$TARGET_DB" -c "TRUNCATE TABLE $TARGET_TABLE CASCADE;" > /dev/null
    else
        echo "   ➕ Mode Append (Pas de Truncate)"
    fi

    echo "   🌊 Streaming des données..."
    psql "$SOURCE_DB" -c "COPY ($SOURCE_SQL) TO STDOUT WITH (FORMAT BINARY)" | \
    psql "$TARGET_DB" -c "COPY $TARGET_TABLE ($TARGET_COLS) FROM STDIN WITH (FORMAT BINARY)"

    if [ $? -eq 0 ]; then
        echo "   ✅ Terminé."
    else
        echo "   ❌ Erreur."
        exit 1
    fi
}

echo "🎬 Démarrage de la migration SOCIAL (Follows, Recos)..."

# # ==============================================================================
# # 1. FOLLOWS (Utilisateurs)
# # ==============================================================================
# # Mapping :
# # user_id (Source) -> follower_id (Celui qui suit)
# # followee_id (Source) -> following_id (Celui qui est suivi)
# # is_pending (Bool) -> status (Enum: 'pending', 'accepted')

# SQL_FOLLOW="
# SELECT 
#     user_id,
#     followee_id,
#     CASE 
#         WHEN is_pending = true THEN 'pending' 
#         ELSE 'accepted' 
#     END,
#     created_at
# FROM public.user_follower
# "

# migrate_query_to_table \
#     "User Follows" \
#     "$SQL_FOLLOW" \
#     "follow" \
#     "follower_id, following_id, status, created_at" \
#     "false"


# # ==============================================================================
# # 2. FOLLOWS (Personnes / Stars)
# # ==============================================================================
# # Mapping direct, juste changement de snake_case vers camelCase (géré par les colonnes cibles)

# SQL_FOLLOW_PERSON="
# SELECT 
#     user_id,
#     person_id,
#     created_at
# FROM public.user_person_follower
# "

# migrate_query_to_table \
#     "Person Follows" \
#     "$SQL_FOLLOW_PERSON" \
#     "follow_person" \
#     "user_id, person_id, created_at" \
#     "false"


# # ==============================================================================
# # 3. RECOMMANDATIONS (Fusion Movie + TV)
# # ==============================================================================
# # La table cible 'reco' fusionne les films et les séries.
# # On ignore l'ID source pour laisser la cible générer de nouveaux IDs (car risque de conflit d'ID entre les 2 tables sources).

# # --- Partie A : Movies ---
# # type = 'movie'
# # movie_id = valeur
# # tv_series_id = NULL

# SQL_RECO_MOVIE="
# SELECT 
#     user_id,
#     sender_id,
#     created_at,
#     created_at,        -- updatedAt (on met created_at par défaut)
#     status,            -- on suppose que l'enum source matche 'active', 'completed', 'delete'
#     comment,
#     'movie',           -- type
#     movie_id,          -- movie_id
#     NULL               -- tv_series_id
# FROM public.user_recos_movie
# "

# migrate_query_to_table \
#     "Recos (Movies)" \
#     "$SQL_RECO_MOVIE" \
#     "reco" \
#     "user_id, sender_id, created_at, updated_at, status, comment, type, movie_id, tv_series_id" \
#     "false" # Premier passage = Truncate


# # --- Partie B : TV Series ---
# # type = 'tv_series'
# # movie_id = NULL
# # tv_series_id = valeur

# SQL_RECO_TV="
# SELECT 
#     user_id,
#     sender_id,
#     created_at,
#     created_at,        -- updatedAt
#     status,
#     comment,
#     'tv_series',       -- type
#     NULL,              -- movie_id
#     tv_series_id       -- tv_series_id
# FROM public.user_recos_tv_series
# "

# migrate_query_to_table \
#     "Recos (TV Series)" \
#     "$SQL_RECO_TV" \
#     "reco" \
#     "user_id, sender_id, created_at, updated_at, status, comment, type, movie_id, tv_series_id" \
#     "true" # Second passage = Append (Pas de Truncate)

# # ==============================================================================
# # 4. BOOKMARKS (Fusion Watchlist Movie + TV)
# # ==============================================================================

# # --- Partie A : Movies ---
# # type = 'movie'
# # movie_id = valeur
# # tv_series_id = NULL

# SQL_BOOKMARK_MOVIE="
# SELECT 
#     user_id,
#     created_at,
#     created_at,        -- updatedAt (on initialise avec created_at)
#     status,            -- on suppose que les status source (watchlist_status) matchent cible (active/completed)
#     comment,
#     'movie',           -- type
#     movie_id,
#     NULL               -- tv_series_id
# FROM public.user_watchlists_movie
# "

# migrate_query_to_table \
#     "Bookmarks (Movies)" \
#     "$SQL_BOOKMARK_MOVIE" \
#     "bookmark" \
#     "user_id, created_at, updated_at, status, comment, type, movie_id, tv_series_id" \
#     "false" # Premier passage = Truncate


# # --- Partie B : TV Series ---
# # type = 'tv_series'
# # movie_id = NULL
# # tv_series_id = valeur

# SQL_BOOKMARK_TV="
# SELECT 
#     user_id,
#     created_at,
#     created_at,        -- updatedAt
#     status,
#     comment,
#     'tv_series',       -- type
#     NULL,              -- movie_id
#     tv_series_id
# FROM public.user_watchlists_tv_series
# "

# migrate_query_to_table \
#     "Bookmarks (TV Series)" \
#     "$SQL_BOOKMARK_TV" \
#     "bookmark" \
#     "user_id, created_at, updated_at, status, comment, type, movie_id, tv_series_id" \
#     "true" # Second passage = Append (Pas de Truncate)

# ==============================================================================
# 5. LOGS MOVIES (Activités Films)
# ==============================================================================
# ON NE GARDE PAS L'ID SOURCE. On laisse l'auto-incrément faire.
# On cast rating en real.

SQL_LOG_MOVIE="
SELECT 
    movie_id,
    user_id,
    created_at,
    updated_at,
    is_liked,
    liked_at,
    rating::real,
    rated_at,
    1,              -- watch_count
    watched_date,   -- first_watched_at
    watched_date    -- last_watched_at
FROM public.user_activities_movie
"

migrate_query_to_table \
    "Log Movies" \
    "$SQL_LOG_MOVIE" \
    "log_movie" \
    "movie_id, user_id, created_at, updated_at, is_liked, liked_at, rating, rated_at, watch_count, first_watched_at, last_watched_at" \
    "false"


# ==============================================================================
# 6. WATCHED DATES MOVIES
# ==============================================================================
echo "---------------------------------------------------"
echo "🚀 Génération : log_movie -> log_movie_watched_date"
echo "   🔨 Insertion SQL interne..."

# On utilise les IDs fraîchement générés
psql "$TARGET_DB" -c "
INSERT INTO log_movie_watched_date (log_movie_id, watched_date)
SELECT id, first_watched_at
FROM log_movie
WHERE first_watched_at IS NOT NULL;
"
echo "   ✅ Terminé (Historique généré)."


# ==============================================================================
# 7. LOGS TV SERIES (Activités Séries)
# ==============================================================================

SQL_LOG_TV="
SELECT 
    tv_series_id,
    user_id,
    created_at,
    updated_at,
    is_liked,
    liked_at,
    rating::real,
    rated_at,
    'watching',
    1,
    watched_date
FROM public.user_activities_tv_series
"

migrate_query_to_table \
    "Log TV Series" \
    "$SQL_LOG_TV" \
    "log_tv_series" \
    "tv_series_id, user_id, created_at, updated_at, is_liked, liked_at, rating, rated_at, status, watch_count, last_watched_at" \
    "false"

# ==============================================================================
# 8. REVIEWS MOVIES (Via Table Intermédiaire)
# ==============================================================================

echo "---------------------------------------------------"
echo "🚀 Migration : Reviews Movies (Dynamique)"

# A. Création table réelle (UNLOGGED pour la vitesse) mais persistante entre les commandes
psql "$TARGET_DB" -c "
DROP TABLE IF EXISTS tmp_reviews_movie;
CREATE UNLOGGED TABLE tmp_reviews_movie (
    user_id uuid,
    movie_id bigint,
    created_at timestamptz,
    updated_at timestamptz,
    title text,
    body text,
    likes_count bigint,
    views_count bigint,
    comments_count bigint
);
" > /dev/null

# B. Requête Source
SQL_REVIEW_SOURCE="
SELECT 
    a.user_id,
    a.movie_id,
    r.created_at,
    r.updated_at,
    NULLIF(TRIM(r.title), ''),
    CASE 
        WHEN r.body ~ '^<html>.*</html>$' THEN r.body
        ELSE '<html>' || r.body || '</html>'
    END,
    r.likes_count,
    r.views_count,
    r.comments_count
FROM public.user_reviews_movie r
JOIN public.user_activities_movie a ON r.id = a.id
"

echo "   🌊 Streaming vers table temporaire..."
psql "$SOURCE_DB" -c "COPY ($SQL_REVIEW_SOURCE) TO STDOUT WITH (FORMAT BINARY)" | \
psql "$TARGET_DB" -c "COPY tmp_reviews_movie FROM STDIN WITH (FORMAT BINARY)"

# C. Insertion Finale + Nettoyage
echo "   🔨 Insertion et mapping des IDs..."
psql "$TARGET_DB" -c "
INSERT INTO review_movie (
    id, created_at, updated_at, title, body, is_spoiler, likes_count, views_count, comments_count
)
SELECT 
    l.id, -- ID du log trouvé
    t.created_at, t.updated_at, t.title, t.body, false, t.likes_count, t.views_count, t.comments_count
FROM tmp_reviews_movie t
JOIN log_movie l ON l.user_id = t.user_id AND l.movie_id = t.movie_id;

DROP TABLE tmp_reviews_movie;
"
echo "   ✅ Terminé."


# ==============================================================================
# 9. REVIEWS TV SERIES (Via Table Intermédiaire)
# ==============================================================================

echo "---------------------------------------------------"
echo "🚀 Migration : Reviews TV Series (Dynamique)"

# A. Table Intermédiaire
psql "$TARGET_DB" -c "
DROP TABLE IF EXISTS tmp_reviews_tv;
CREATE UNLOGGED TABLE tmp_reviews_tv (
    user_id uuid,
    tv_series_id bigint,
    created_at timestamptz,
    updated_at timestamptz,
    title text,
    body text,
    likes_count bigint,
    views_count bigint,
    comments_count bigint
);
" > /dev/null

# B. Requête Source
SQL_REVIEW_TV_SOURCE="
SELECT 
    a.user_id,
    a.tv_series_id,
    r.created_at,
    r.updated_at,
    NULLIF(TRIM(r.title), ''),
    CASE 
        WHEN r.body ~ '^<html>.*</html>$' THEN r.body
        ELSE '<html>' || r.body || '</html>'
    END,
    r.likes_count,
    r.views_count,
    r.comments_count
FROM public.user_reviews_tv_series r
JOIN public.user_activities_tv_series a ON r.id = a.id
"

echo "   🌊 Streaming vers table temporaire..."
psql "$SOURCE_DB" -c "COPY ($SQL_REVIEW_TV_SOURCE) TO STDOUT WITH (FORMAT BINARY)" | \
psql "$TARGET_DB" -c "COPY tmp_reviews_tv FROM STDIN WITH (FORMAT BINARY)"

# C. Insertion Finale + Nettoyage
echo "   🔨 Insertion et mapping des IDs..."
psql "$TARGET_DB" -c "
INSERT INTO review_tv_series (
    id, created_at, updated_at, title, body, is_spoiler, likes_count, views_count, comments_count
)
SELECT 
    l.id,
    t.created_at, t.updated_at, t.title, t.body, false, t.likes_count, t.views_count, t.comments_count
FROM tmp_reviews_tv t
JOIN log_tv_series l ON l.user_id = t.user_id AND l.tv_series_id = t.tv_series_id;

DROP TABLE tmp_reviews_tv;
"
echo "   ✅ Terminé."


# ==============================================================================
# 10. REVIEWS LIKES MOVIE (Dynamique)
# ==============================================================================
echo "---------------------------------------------------"
echo "🚀 Migration : Review Likes (Movie)"

# A. Table Intermédiaire
psql "$TARGET_DB" -c "
DROP TABLE IF EXISTS tmp_review_likes_movie;
CREATE UNLOGGED TABLE tmp_review_likes_movie (
    liker_id uuid,
    author_id uuid,
    movie_id bigint,
    created_at timestamptz
);
" > /dev/null

# B. Requête Source
SQL_LIKES_MOVIE_SOURCE="
SELECT 
    l.user_id,
    a.user_id,
    a.movie_id,
    l.created_at
FROM public.user_review_movie_likes l
JOIN public.user_reviews_movie r ON l.review_id = r.id
JOIN public.user_activities_movie a ON r.id = a.id
"

echo "   🌊 Streaming vers table temporaire..."
psql "$SOURCE_DB" -c "COPY ($SQL_LIKES_MOVIE_SOURCE) TO STDOUT WITH (FORMAT BINARY)" | \
psql "$TARGET_DB" -c "COPY tmp_review_likes_movie FROM STDIN WITH (FORMAT BINARY)"

# C. Insertion Finale + Nettoyage
echo "   🔨 Insertion et mapping des IDs..."
psql "$TARGET_DB" -c "
INSERT INTO review_movie_like (review_id, user_id, created_at)
SELECT 
    log.id,
    tmp.liker_id,
    tmp.created_at
FROM tmp_review_likes_movie tmp
JOIN log_movie log ON log.user_id = tmp.author_id AND log.movie_id = tmp.movie_id
ON CONFLICT DO NOTHING;

DROP TABLE tmp_review_likes_movie;
"
echo "   ✅ Terminé."


# ==============================================================================
# 11. REVIEWS LIKES TV SERIES (Dynamique)
# ==============================================================================
echo "---------------------------------------------------"
echo "🚀 Migration : Review Likes (TV Series)"

# A. Table Intermédiaire
psql "$TARGET_DB" -c "
DROP TABLE IF EXISTS tmp_review_likes_tv;
CREATE UNLOGGED TABLE tmp_review_likes_tv (
    liker_id uuid,
    author_id uuid,
    tv_series_id bigint,
    created_at timestamptz
);
" > /dev/null

# B. Requête Source
SQL_LIKES_TV_SOURCE="
SELECT 
    l.user_id,
    a.user_id,
    a.tv_series_id,
    l.created_at
FROM public.user_review_tv_series_likes l
JOIN public.user_reviews_tv_series r ON l.review_id = r.id
JOIN public.user_activities_tv_series a ON r.id = a.id
"

echo "   🌊 Streaming vers table temporaire..."
psql "$SOURCE_DB" -c "COPY ($SQL_LIKES_TV_SOURCE) TO STDOUT WITH (FORMAT BINARY)" | \
psql "$TARGET_DB" -c "COPY tmp_review_likes_tv FROM STDIN WITH (FORMAT BINARY)"

# C. Insertion Finale + Nettoyage
echo "   🔨 Insertion et mapping des IDs..."
psql "$TARGET_DB" -c "
INSERT INTO review_tv_series_like (review_id, user_id, created_at)
SELECT 
    log.id,
    tmp.liker_id,
    tmp.created_at
FROM tmp_review_likes_tv tmp
JOIN log_tv_series log ON log.user_id = tmp.author_id AND log.tv_series_id = tmp.tv_series_id
ON CONFLICT DO NOTHING;

DROP TABLE tmp_review_likes_tv;
"
echo "   ✅ Terminé."

# ==============================================================================
# FIN : RESET DES SÉQUENCES
# ==============================================================================
echo "---------------------------------------------------"
echo "🔄 Mise à jour des séquences (Auto-increment)..."

psql "$TARGET_DB" -c "SELECT setval(pg_get_serial_sequence('log_movie', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM log_movie;" > /dev/null
psql "$TARGET_DB" -c "SELECT setval(pg_get_serial_sequence('log_tv_series', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM log_tv_series;" > /dev/null
# Les reviews partagent l'ID des logs, donc pas de séquence propre à reset, mais on peut faire celles des autres tables si besoin (reco, bookmark)
psql "$TARGET_DB" -c "SELECT setval(pg_get_serial_sequence('reco', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM reco;" > /dev/null
psql "$TARGET_DB" -c "SELECT setval(pg_get_serial_sequence('bookmark', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM bookmark;" > /dev/null

echo "   ✅ Séquences synchronisées."

echo "---------------------------------------------------"
echo "🎉 Migration SOCIAL complète terminée."
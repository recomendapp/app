#!/bin/bash
set -e

# Charger les variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

TARGET_DB=$TARGET_DATABASE_URL

echo "🎬 Démarrage de la génération du FEED..."

# 1. On vide la table feed au cas où on relance le script
echo "   🧹 Nettoyage de la table feed..."
psql "$TARGET_DB" -c "TRUNCATE TABLE public.feed CASCADE;" > /dev/null

# 2. Insertion des Logs Movies
echo "   🍿 Ajout des Logs Movies..."
psql "$TARGET_DB" -c "
INSERT INTO public.feed (created_at, user_id, activity_type, activity_id)
SELECT created_at, user_id, 'log_movie', id 
FROM public.log_movie;
"

# 3. Insertion des Logs TV Series
echo "   📺 Ajout des Logs TV Series..."
psql "$TARGET_DB" -c "
INSERT INTO public.feed (created_at, user_id, activity_type, activity_id)
SELECT created_at, user_id, 'log_tv_series', id 
FROM public.log_tv_series;
"

# 4. Insertion des Likes de Playlists
echo "   🎶 Ajout des Likes de Playlists..."
psql "$TARGET_DB" -c "
INSERT INTO public.feed (created_at, user_id, activity_type, activity_id)
SELECT created_at, user_id, 'playlist_like', id 
FROM public.playlist_like;
"

# 5. Insertion des Likes de Reviews (Movie)
echo "   👍 Ajout des Likes de Reviews (Movies)..."
psql "$TARGET_DB" -c "
INSERT INTO public.feed (created_at, user_id, activity_type, activity_id)
SELECT created_at, user_id, 'review_movie_like', id 
FROM public.review_movie_like;
"

# 6. Insertion des Likes de Reviews (TV Series)
echo "   👍 Ajout des Likes de Reviews (TV)..."
psql "$TARGET_DB" -c "
INSERT INTO public.feed (created_at, user_id, activity_type, activity_id)
SELECT created_at, user_id, 'review_tv_series_like', id 
FROM public.review_tv_series_like;
"

# 7. Reset de la séquence du Feed
echo "   🔄 Reset de la séquence..."
psql "$TARGET_DB" -c "SELECT setval(pg_get_serial_sequence('feed', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM feed;" > /dev/null

echo "   ✅ Génération du Feed terminée avec succès !"
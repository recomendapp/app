#!/bin/bash
set -e

# Charger les variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

SOURCE_DB=$SOURCE_DATABASE_URL
TARGET_DB=$TARGET_DATABASE_URL

echo "🎬 Démarrage de la migration UI BACKGROUNDS..."
echo "---------------------------------------------------"
echo "🚀 Migration : UI Backgrounds via table de staging"

# 1. On crée une table temporaire sur la CIBLE
echo "   🧹 Création de la table de staging sur la cible..."
psql "$TARGET_DB" -c "
DROP TABLE IF EXISTS public._staging_ui_backgrounds;
CREATE TABLE public._staging_ui_backgrounds (
    id uuid,
    type text,
    file_path text
);
" > /dev/null

# 2. On extrait l'URL de la SOURCE (en la transformant en file_path) et on l'envoie vers la table temporaire CIBLE
echo "   🌊 Streaming des données (file_paths) vers la DB cible..."
SQL_SOURCE="
SELECT 
    id, 
    media_type, 
    REPLACE(url, 'https://image.tmdb.org/t/p/original', '') AS file_path
FROM public.ui_backgrounds
"

psql "$SOURCE_DB" -c "COPY ($SQL_SOURCE) TO STDOUT WITH (FORMAT CSV)" | \
psql "$TARGET_DB" -c "COPY public._staging_ui_backgrounds (id, type, file_path) FROM STDIN WITH (FORMAT CSV)"

# 3. Sur la CIBLE, on insère les vraies données en cherchant les bons IDs locaux grâce au file_path
echo "   🔗 Résolution des IDs locaux et insertion finale..."
psql "$TARGET_DB" -c "
TRUNCATE TABLE ui.background CASCADE;

INSERT INTO ui.background (id, type, movie_image_id, tv_series_image_id)
SELECT 
    t.id,
    t.type::ui.ui_background_type,
    (SELECT id FROM tmdb.movie_image WHERE file_path = t.file_path LIMIT 1) AS movie_image_id,
    (SELECT id FROM tmdb.tv_series_image WHERE file_path = t.file_path LIMIT 1) AS tv_series_image_id
FROM public._staging_ui_backgrounds t
WHERE 
    -- Sécurité : On insère UNIQUEMENT si l'image a bien été trouvée dans la nouvelle DB
    (t.type = 'movie' AND EXISTS (SELECT 1 FROM tmdb.movie_image WHERE file_path = t.file_path))
    OR 
    (t.type = 'tv_series' AND EXISTS (SELECT 1 FROM tmdb.tv_series_image WHERE file_path = t.file_path));

-- On nettoie la table temporaire
DROP TABLE public._staging_ui_backgrounds;
" > /dev/null

echo "   ✅ Terminé."
echo "---------------------------------------------------"
echo "🎉 Migration UI complète terminée."
#!/bin/bash
set -e

# Charger les variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

SOURCE_DB=$SOURCE_DATABASE_URL
TARGET_DB=$TARGET_DATABASE_URL

# Fonction helper
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

echo "🎬 Démarrage de la migration PLAYLISTS..."

# ==============================================================================
# 1. PLAYLISTS (Table Principale)
# ==============================================================================
# - On garde l'ID pour préserver les liaisons (likes, items, members).
# - On transforme private (bool) -> visibility (enum).
# - On nettoie la description (comme pour le profil) pour respecter les contraintes.

SQL_PLAYLIST="
SELECT 
    id,
    created_at,
    updated_at,
    user_id,
    title,
    NULLIF(TRIM(description), ''), -- Nettoyage simple (ou utiliser REGEXP_REPLACE si besoin)
    poster_url,
    CASE 
        WHEN private = true THEN 'private' 
        ELSE 'public' 
    END, -- Transformation bool -> enum
    items_count,
    saved_count,
    likes_count
FROM public.playlists
"

migrate_query_to_table \
    "Playlists" \
    "$SQL_PLAYLIST" \
    "playlist" \
    "id, created_at, updated_at, user_id, title, description, poster, visibility, items_count, saved_count, likes_count" \
    "false"


# ==============================================================================
# 2. PLAYLIST MEMBERS (Guests)
# ==============================================================================
# - Transformation edit (bool) -> role (enum).

SQL_MEMBERS="
SELECT 
    playlist_id,
    user_id,
    created_at,
    CASE 
        WHEN edit = true THEN 'editor' 
        ELSE 'viewer' 
    END -- Transformation bool -> enum
FROM public.playlist_guests
"

migrate_query_to_table \
    "Playlist Members" \
    "$SQL_MEMBERS" \
    "playlist_member" \
    "playlist_id, user_id, created_at, role" \
    "false"


# ==============================================================================
# 3. PLAYLIST ITEMS (Fusion Movie + TV)
# ==============================================================================
# On NE GARDE PAS l'ID source ici (conflit probable entre Movie ID 1 et TV ID 1).
# La cible génèrera ses propres IDs.

# --- Partie A : Movies ---
SQL_ITEMS_MOVIE="
SELECT 
    playlist_id,
    user_id,
    created_at,
    created_at,     -- updatedAt (défaut)
    comment,
    rank,
    'movie',        -- type
    movie_id,
    NULL            -- tv_series_id
FROM public.playlist_items_movie
"

migrate_query_to_table \
    "Playlist Items (Movies)" \
    "$SQL_ITEMS_MOVIE" \
    "playlist_item" \
    "playlist_id, user_id, created_at, updated_at, comment, rank, type, movie_id, tv_series_id" \
    "false" # Truncate


# --- Partie B : TV Series ---
SQL_ITEMS_TV="
SELECT 
    playlist_id,
    user_id,
    created_at,
    created_at,     -- updatedAt
    comment,
    rank,
    'tv_series',    -- type
    NULL,           -- movie_id
    tv_series_id
FROM public.playlist_items_tv_series
"

migrate_query_to_table \
    "Playlist Items (TV)" \
    "$SQL_ITEMS_TV" \
    "playlist_item" \
    "playlist_id, user_id, created_at, updated_at, comment, rank, type, movie_id, tv_series_id" \
    "true" # Append (Pas de Truncate)


# ==============================================================================
# 4. PLAYLIST LIKES
# ==============================================================================

SQL_LIKES="
SELECT created_at, playlist_id, user_id
FROM public.playlists_likes
"

migrate_query_to_table \
    "Playlist Likes" \
    "$SQL_LIKES" \
    "playlist_like" \
    "created_at, playlist_id, user_id" \
    "false"


# ==============================================================================
# 5. PLAYLIST SAVED
# ==============================================================================

SQL_SAVED="
SELECT created_at, playlist_id, user_id
FROM public.playlists_saved
"

migrate_query_to_table \
    "Playlist Saved" \
    "$SQL_SAVED" \
    "playlist_saved" \
    "created_at, playlist_id, user_id" \
    "false"


# ==============================================================================
# FIN : RESET DES SÉQUENCES
# ==============================================================================
echo "---------------------------------------------------"
echo "🔄 Mise à jour des séquences (Auto-increment)..."

# Pour toutes les tables où on a forcé l'ID
psql "$TARGET_DB" -c "SELECT setval(pg_get_serial_sequence('playlist', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM playlist;" > /dev/null

# Pour playlist_item, même si on n'a pas forcé l'ID, c'est une bonne pratique de s'assurer que la séquence est bien calée
psql "$TARGET_DB" -c "SELECT setval(pg_get_serial_sequence('playlist_item', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM playlist_item;" > /dev/null

echo "   ✅ Séquences synchronisées."
echo "🎉 Migration PLAYLISTS complète terminée."
#!/bin/bash
set -e # Arrête le script dès qu'une erreur survient
set -o pipefail

# 1. Charger les variables d'environnement (depuis .env)
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

SOURCE_DB=$SOURCE_DATABASE_URL
TARGET_DB=$TARGET_DATABASE_URL

# Fonction générique de migration
migrate_table() {
    local SRC_TABLE=$1
    local TGT_TABLE=$2
    local SRC_QUERY_COLS=$3
    local TGT_COLS=$4
    local LOCAL_FILE="/tmp/mig_${SRC_TABLE}.bin"

    echo "---------------------------------------------------"
    echo "🚀 Migration : $SRC_TABLE -> $TGT_TABLE"

    # 1. Truncate (Nettoyage)
    echo "   🧹 Truncate cible..."
    psql "$TARGET_DB" -c "SET session_replication_role = 'replica'; TRUNCATE TABLE $TGT_TABLE CASCADE;" > /dev/null

    # 2. TÉLÉCHARGEMENT LOCAL (Conditionnel)
    if [ -f "$LOCAL_FILE" ]; then
        echo "   ♻️ Fichier local trouvé ($LOCAL_FILE). Téléchargement ignoré !"
    else
        echo "   📥 Téléchargement local en cours (Patientez)..."
        psql "$SOURCE_DB" -c "COPY (SELECT $SRC_QUERY_COLS FROM $SRC_TABLE) TO STDOUT WITH (FORMAT BINARY)" > "$LOCAL_FILE"
    fi

    # 3. UPLOAD VERS K3S
    echo "   📤 Upload vers la base K3s..."
    psql "$TARGET_DB" -c "SET session_replication_role = 'replica'; COPY $TGT_TABLE ($TGT_COLS) FROM STDIN WITH (FORMAT BINARY)" < "$LOCAL_FILE"

    # 4. Validation et Nettoyage
    if [ $? -eq 0 ]; then
        echo "   ✅ Terminé avec succès."
        # On supprime le fichier uniquement si l'upload a fonctionné
        rm -f "$LOCAL_FILE"
    else
        echo "   ❌ Erreur lors de l'upload de $SRC_TABLE"
        echo "   ⚠️ Le fichier $LOCAL_FILE a été conservé pour une prochaine tentative."
        exit 1
    fi
}

echo "🔍 Vérification des connexions aux bases de données..."
psql "$SOURCE_DB" -c '\conninfo'
psql "$TARGET_DB" -c '\conninfo'
echo "🎬 Démarrage de la migration TMDB..."

# echo "   🗂️  Group 1: Core 'Enum' Tables"
# migrate_table "tmdb_language" "tmdb.language" "iso_639_1" "iso_639_1"
# migrate_table "tmdb_country" "tmdb.country" "iso_3166_1" "iso_3166_1"
# migrate_table "tmdb_gender" "tmdb.gender" "id" "id"
# migrate_table "tmdb_genre" "tmdb.genre" "id" "id"
# migrate_table "tmdb_genre_translation" "tmdb.genre_translation" "genre, language, name" "genre_id, language, name"
# migrate_table "tmdb_keyword" "tmdb.keyword" "id, name" "id, name"

# # echo "   🏢 Migrate Departments"
# # migrate_table "tmdb_department" "tmdb.department" "id, name" "id, name"

# echo "   🏛️ Migrate Collections"
# migrate_table "tmdb_collection" "tmdb.collection" "id, name" "id, name"
# migrate_table "tmdb_collection_image" "tmdb.collection_image" "id, collection, file_path, type, aspect_ratio, height, width, vote_average, vote_count, iso_639_1" "id, collection_id, file_path, type, aspect_ratio, height, width, vote_average, vote_count, iso_639_1"
# migrate_table "tmdb_collection_translation" "tmdb.collection_translation" "id, collection, iso_639_1, overview, title, iso_3166_1, homepage" "id, collection_id, iso_639_1, overview, title, iso_3166_1, homepage"

# echo "   🏢 Migrate Companies"
# migrate_table "tmdb_company" "tmdb.company" "id, name, description, headquarters, homepage, origin_country, parent_company" "id, name, description, headquarters, homepage, origin_country, parent_company"
# migrate_table "tmdb_company_alternative_name" "tmdb.company_alternative_name" "id, company, name" "id, company_id, name"
# migrate_table "tmdb_company_image" "tmdb.company_image" "id, company, file_path, file_type, aspect_ratio, height, width, vote_average, vote_count" "id, company_id, file_path, file_type, aspect_ratio, height, width, vote_average, vote_count"

# echo "   📺 Migrate Networks"
# migrate_table "tmdb_network" "tmdb.network" "id, name, headquarters, homepage, origin_country" "id, name, headquarters, homepage, origin_country"
# migrate_table "tmdb_network_alternative_name" "tmdb.network_alternative_name" "id, network, name, type" "id, network_id, name, type"
# migrate_table "tmdb_network_image" "tmdb.network_image" "id, network, file_path, file_type, aspect_ratio, height, width, vote_average, vote_count" "id, network_id, file_path, file_type, aspect_ratio, height, width, vote_average, vote_count"

# echo "   👤 Migrate Persons"
# migrate_table "tmdb_person" "tmdb.person" "id, adult, birthday, deathday, gender, homepage, imdb_id, known_for_department, name, place_of_birth, popularity" "id, adult, birthday, deathday, gender, homepage, imdb_id, known_for_department, name, place_of_birth, popularity"
# migrate_table "tmdb_person_also_known_as" "tmdb.person_also_known_as" "id, person, name" "id, person_id, name"
# migrate_table "tmdb_person_external_id" "tmdb.person_external_id" "id, person, source, value" "id, person_id, source, value"
# migrate_table "tmdb_person_image" "tmdb.person_image" "id, person, file_path, aspect_ratio, height, width, vote_average, vote_count" "id, person_id, file_path, aspect_ratio, height, width, vote_average, vote_count"
# migrate_table "tmdb_person_translation" "tmdb.person_translation" "id, person, biography, iso_639_1, iso_3166_1" "id, person_id, biography, iso_639_1, iso_3166_1"

# echo "   🎬 Migrate Movies"
# migrate_table "tmdb_movie" "tmdb.movie" "id, adult, budget, original_language, original_title, popularity, revenue, status, vote_average, vote_count, belongs_to_collection, updated_at" "id, adult, budget, original_language, original_title, popularity, revenue, status, vote_average, vote_count, belongs_to_collection, updated_at"
migrate_table "tmdb_movie_credits" "tmdb.movie_credit" "id, movie_id, person_id, department, job" "id, movie_id, person_id, department, job"
migrate_table "tmdb_movie_external_ids" "tmdb.movie_external_id" "movie_id, source, value" "movie_id, source, value"
migrate_table "tmdb_movie_genres" "tmdb.movie_genre" "movie_id, genre_id" "movie_id, genre_id"
migrate_table "tmdb_movie_images" "tmdb.movie_image" "movie_id, file_path, type, aspect_ratio, height, width, vote_average, vote_count, iso_639_1" "movie_id, file_path, type, aspect_ratio, height, width, vote_average, vote_count, iso_639_1"
migrate_table "tmdb_movie_keywords" "tmdb.movie_keyword" "movie_id, keyword_id" "movie_id, keyword_id"
migrate_table "tmdb_movie_origin_country" "tmdb.movie_origin_country" "movie_id, iso_3166_1" "movie_id, iso_3166_1"
migrate_table "tmdb_movie_production_companies" "tmdb.movie_production_company" "movie_id, company_id" "movie_id, company_id"
migrate_table "tmdb_movie_production_countries" "tmdb.movie_production_country" "movie_id, iso_3166_1" "movie_id, iso_3166_1"
migrate_table "tmdb_movie_release_dates" "tmdb.movie_release_date" "movie_id, iso_3166_1, release_date::date, certification, iso_639_1, note, release_type, descriptors" "movie_id, iso_3166_1, release_date, certification, iso_639_1, note, release_type, descriptors"
migrate_table "tmdb_movie_roles" "tmdb.movie_role" "credit_id, character, \"order\"" "credit_id, character, \"order\""
migrate_table "tmdb_movie_spoken_languages" "tmdb.movie_spoken_language" "movie_id, iso_639_1" "movie_id, iso_639_1"
migrate_table "tmdb_movie_translations" "tmdb.movie_translation" "movie_id, overview, tagline, title, homepage, runtime, iso_639_1, iso_3166_1" "movie_id, overview, tagline, title, homepage, runtime, iso_639_1, iso_3166_1"
migrate_table "tmdb_movie_videos" "tmdb.movie_video" "id, movie_id, iso_639_1, iso_3166_1, name, key, site, size, type, official, published_at" "id, movie_id, iso_639_1, iso_3166_1, name, key, site, size, type, official, published_at"

echo "   📺 Migrate TV Series"
migrate_table "tmdb_tv_series" "tmdb.tv_series" "id, adult, in_production, original_language, original_name, popularity, status, type, vote_average, vote_count, number_of_episodes, number_of_seasons, first_air_date, last_air_date" "id, adult, in_production, original_language, original_name, popularity, status, type, vote_average, vote_count, number_of_episodes, number_of_seasons, first_air_date, last_air_date"
migrate_table "tmdb_tv_series_alternative_titles" "tmdb.tv_series_alternative_title" "serie_id, iso_3166_1, title, type" "tv_series_id, iso_3166_1, title, type"
migrate_table "tmdb_tv_series_content_ratings" "tmdb.tv_series_content_rating" "serie_id, iso_3166_1, rating, descriptors" "tv_series_id, iso_3166_1, rating, descriptors"
migrate_table "tmdb_tv_series_credits" "tmdb.tv_series_credit" "id, serie_id, person_id, department, job" "id, tv_series_id, person_id, department, job"
migrate_table "tmdb_tv_series_external_ids" "tmdb.tv_series_external_id" "serie_id, source, value" "tv_series_id, source, value"
migrate_table "tmdb_tv_series_genres" "tmdb.tv_series_genre" "serie_id, genre_id" "tv_series_id, genre_id"
migrate_table "tmdb_tv_series_images" "tmdb.tv_series_image" "serie_id, file_path, type, aspect_ratio, height, width, vote_average, vote_count, iso_639_1" "tv_series_id, file_path, type, aspect_ratio, height, width, vote_average, vote_count, iso_639_1"
migrate_table "tmdb_tv_series_keywords" "tmdb.tv_series_keyword" "serie_id, keyword_id" "tv_series_id, keyword_id"
migrate_table "tmdb_tv_series_languages" "tmdb.tv_series_language" "serie_id, iso_639_1" "tv_series_id, iso_639_1"
migrate_table "tmdb_tv_series_networks" "tmdb.tv_series_network" "serie_id, network_id" "tv_series_id, network_id"
migrate_table "tmdb_tv_series_origin_country" "tmdb.tv_series_origin_country" "serie_id, iso_3166_1" "tv_series_id, iso_3166_1"
migrate_table "tmdb_tv_series_production_companies" "tmdb.tv_series_production_company" "serie_id, company_id" "tv_series_id, company_id"
migrate_table "tmdb_tv_series_production_countries" "tmdb.tv_series_production_country" "serie_id, iso_3166_1" "tv_series_id, iso_3166_1"
migrate_table "tmdb_tv_series_roles" "tmdb.tv_series_role" "credit_id, character, episode_count, \"order\"" "credit_id, character, episode_count, \"order\""
migrate_table "tmdb_tv_series_spoken_languages" "tmdb.tv_series_spoken_language" "serie_id, iso_639_1" "tv_series_id, iso_639_1"
migrate_table "tmdb_tv_series_translations" "tmdb.tv_series_translation" "serie_id, name, overview, homepage, tagline, iso_639_1, iso_3166_1" "tv_series_id, name, overview, homepage, tagline, iso_639_1, iso_3166_1"
migrate_table "tmdb_tv_series_videos" "tmdb.tv_series_video" "id, serie_id, iso_639_1, iso_3166_1, name, key, site, size, type, official, published_at" "id, tv_series_id, iso_639_1, iso_3166_1, name, key, site, size, type, official, published_at"

echo "   📺 Migrate TV Seasons"
migrate_table "tmdb_tv_series_seasons" "tmdb.tv_season" "id, serie_id, season_number, vote_average, vote_count, poster_path" "id, tv_series_id, season_number, vote_average, vote_count, poster_path"
migrate_table "tmdb_tv_series_seasons_credits" "tmdb.tv_season_credit" "id, credit_id, season_id, \"order\"" "id, credit_id, tv_season_id, \"order\""
migrate_table "tmdb_tv_series_seasons_translations" "tmdb.tv_season_translation" "id, season_id, name, overview, iso_639_1, iso_3166_1" "id, tv_season_id, name, overview, iso_639_1, iso_3166_1"


echo "   📺 Migrate TV Episodes"
migrate_table "tmdb_tv_series_episodes" "tmdb.tv_episode" "id, season_id, air_date::date, episode_number, episode_type, name, overview, production_code, runtime, still_path, vote_average, vote_count" "id, tv_season_id, air_date, episode_number, episode_type, name, overview, production_code, runtime, still_path, vote_average, vote_count"
migrate_table "tmdb_tv_series_episodes_credits" "tmdb.tv_episode_credit" "credit_id, episode_id" "credit_id, tv_episode_id"

echo "   🧮 Calcul du nombre d'épisodes par saison (episode_count)..."
psql "$TARGET_DB" -c "
UPDATE tmdb.tv_season
SET episode_count = subquery.cnt
FROM (
    SELECT tv_season_id, COUNT(*)::integer AS cnt
    FROM tmdb.tv_episode
    GROUP BY tv_season_id
) AS subquery
WHERE tmdb.tv_season.id = subquery.tv_season_id;
"
echo "   ✅ Calcul de l'episode_count terminé."

echo "   📊 Migrate Sync Logs"
migrate_table "sync_logs" "tmdb.sync_logs" "id, created_at, updated_at, REPLACE(type::text, 'tmdb_', ''), status::text, date" "id, created_at, updated_at, type, status, date"

# ---------------------------------------------------------------------------- #
#                          RÉINITIALISATION DES SÉQUENCES                      #
# ---------------------------------------------------------------------------- #
echo "   🔢 Mise à jour des séquences (AUTO INCREMENT)..."

reset_sequence() {
    local SCHEMA_TABLE=$1
    local COLUMN=${2:-id} # Utilise 'id' par défaut, sinon la colonne spécifiée
    
    # Exécute la mise à jour de la séquence en ignorant silencieusement les tables qui n'en ont pas
    psql "$TARGET_DB" -c "
        DO \$\$ 
        DECLARE 
            seq_name text;
        BEGIN 
            seq_name := pg_get_serial_sequence('$SCHEMA_TABLE', '$COLUMN');
            IF seq_name IS NOT NULL THEN 
                EXECUTE 'SELECT setval(''' || seq_name || ''', COALESCE((SELECT MAX(' || quote_ident('$COLUMN') || ') FROM $SCHEMA_TABLE), 1), true)';
            END IF;
        END \$\$;
    " > /dev/null 2>&1
    
    echo "      🔄 Séquence vérifiée/mise à jour pour $SCHEMA_TABLE"
}

# On liste ici toutes les tables Drizzle qui ont un id en generatedByDefaultAsIdentity()
reset_sequence "tmdb.collection_translation"
reset_sequence "tmdb.collection_image"
reset_sequence "tmdb.company_alternative_name"
reset_sequence "tmdb.company_image"
reset_sequence "tmdb.network_alternative_name"
reset_sequence "tmdb.network_image"
reset_sequence "tmdb.person_also_known_as"
reset_sequence "tmdb.person_external_id"
reset_sequence "tmdb.person_image"
reset_sequence "tmdb.person_translation"
reset_sequence "tmdb.movie_external_id"
reset_sequence "tmdb.movie_genre"
reset_sequence "tmdb.movie_image"
reset_sequence "tmdb.movie_keyword"
reset_sequence "tmdb.movie_origin_country"
reset_sequence "tmdb.movie_production_company"
reset_sequence "tmdb.movie_production_country"
reset_sequence "tmdb.movie_release_date"
reset_sequence "tmdb.movie_spoken_language"
reset_sequence "tmdb.movie_translation"
reset_sequence "tmdb.tv_series_alternative_title"
reset_sequence "tmdb.tv_series_content_rating"
reset_sequence "tmdb.tv_series_external_id"
reset_sequence "tmdb.tv_series_genre"
reset_sequence "tmdb.tv_series_image"
reset_sequence "tmdb.tv_series_keyword"
reset_sequence "tmdb.tv_series_language"
reset_sequence "tmdb.tv_series_network"
reset_sequence "tmdb.tv_series_origin_country"
reset_sequence "tmdb.tv_series_production_company"
reset_sequence "tmdb.tv_series_production_country"
reset_sequence "tmdb.tv_series_spoken_language"
reset_sequence "tmdb.tv_series_translation"
reset_sequence "tmdb.tv_season_credit"
reset_sequence "tmdb.tv_season_translation"
reset_sequence "tmdb.tv_episode_credit"
reset_sequence "tmdb.sync_logs"

echo "   ✅ Toutes les séquences ont été mises à jour."

echo "   🎉 Migration TMDB terminée avec succès !"
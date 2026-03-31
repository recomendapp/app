#!/bin/bash
set -e

# Charger les variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

TARGET_DB=$TARGET_DATABASE_URL

echo "🎬 Démarrage de la migration du Storage (Supabase -> MinIO)..."

# 1. Configuration de l'alias MinIO (mc)
echo "   🔧 Configuration de la connexion MinIO..."
# On force l'alias "myminio" avec tes identifiants
mc alias set myminio "$S3_ENDPOINT" "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY" > /dev/null

# Création des buckets/dossiers si nécessaire (silencieux)
mc mb myminio/$S3_BUCKET 2>/dev/null || true
mc anonymous set download myminio/$S3_BUCKET > /dev/null

# 2. Fonction magique de migration par table
migrate_storage_folder() {
    local TABLE=$1
    local COLUMN=$2
    local MINIO_FOLDER=$3

    echo "---------------------------------------------------"
    echo "🚀 Migration Médias : $TABLE ($COLUMN) -> $MINIO_FOLDER"

    # On récupère l'ID et l'URL complète, au format CSV (id,url)
    # On filtre pour ne prendre que les URLs Supabase
    psql "$TARGET_DB" -t -A -F"," -c "SELECT id, $COLUMN FROM $TABLE WHERE $COLUMN LIKE '%supabase.recomend.app/storage%';" | while IFS=',' read -r id file_url; do
        if [ -n "$file_url" ]; then
            # Nettoyer l'URL (enlever les éventuels query params genre ?t=123)
            clean_url=$(echo "$file_url" | cut -d? -f1)
            
            # Extraire juste le nom du fichier (ex: 06e6f0e7.jpg)
            filename=$(basename "$clean_url")
            
            echo "   ⬇️  Traitement : $filename"
            
            # 1. Télécharger temporairement
            curl -s "$file_url" -o "/tmp/$filename"
            
            # 2. Uploader sur MinIO dans le bon dossier
            mc cp "/tmp/$filename" "myminio/$S3_BUCKET/$MINIO_FOLDER/$filename" > /dev/null
            
            # 3. Mettre à jour la base de données cible avec JUSTE LE NOM (comme attendu par NestJS)
            # Attention: l'ID d'une playlist est un entier, l'ID d'un user est un UUID.
            psql "$TARGET_DB" -c "UPDATE $TABLE SET $COLUMN = '$filename' WHERE id = '$id';" > /dev/null
            
            # 4. Nettoyer le fichier temporaire
            rm -f "/tmp/$filename"
        fi
    done
    
    echo "   ✅ Dossier $MINIO_FOLDER terminé."
}

# 3. Exécution pour tes 3 dossiers

# Les Avatars (dans la table auth.user, colonne image d'après ton auth.sh)
migrate_storage_folder "auth.user" "image" "avatars"

# Les Backgrounds (dans la table public.profile, colonne background_image)
migrate_storage_folder "profile" "background_image" "backgrounds"

# Les Posters de Playlists (dans la table public.playlist, colonne poster)
# /!\ Supabase utilisait "playlist_posters", MinIO/NestJS utilise "playlist-posters" (géré par le script !)
migrate_storage_folder "playlist" "poster" "playlist-posters"

echo "---------------------------------------------------"
echo "🎉 Migration Storage terminée avec succès !"
#!/bin/bash
set -e

echo "==================================================="
echo "🚀 DÉMARRAGE DE LA MIGRATION GLOBALE"
echo "==================================================="

# Rendre tous les scripts exécutables
chmod +x scripts/*.sh

# 1. TMDB (Aucune dépendance externe)
echo "➡️ Étape 1/6 : TMDB"
./scripts/tmdb.sh

# 2. AUTH (Utilisateurs et Profils, dépend de rien)
echo "➡️ Étape 2/6 : AUTH"
./scripts/auth.sh

# 3. PLAYLISTS (Dépend de TMDB et AUTH)
echo "➡️ Étape 3/6 : PLAYLISTS"
./scripts/playlists.sh

# 4. SOCIAL (Dépend de TMDB et AUTH)
echo "➡️ Étape 4/6 : SOCIAL"
./scripts/social.sh

# 5. FEED (Dépend de PLAYLISTS et SOCIAL)
echo "➡️ Étape 5/6 : FEED"
./scripts/feed.sh

# 6. STORAGE (Médias S3)
echo "➡️ Étape 6/6 : STORAGE (S3 -> MinIO)"
./scripts/storage.sh

echo "==================================================="
echo "🎉 MIGRATION COMPLÈTE TERMINÉE AVEC SUCCÈS !"
echo "==================================================="
#!/bin/bash
set -e

echo "==================================================="
echo "🚀 DÉMARRAGE DE LA MIGRATION GLOBALE"
echo "==================================================="

# Rendre tous les scripts exécutables
chmod +x scripts/*.sh

# 1. TMDB (Aucune dépendance externe)
echo "➡️ Étape 1/7 : TMDB"
./scripts/tmdb.sh

# 2. AUTH (Utilisateurs et Profils, dépend de rien)
echo "➡️ Étape 2/7 : AUTH"
./scripts/auth.sh

# 3. PLAYLISTS (Dépend de TMDB et AUTH)
echo "➡️ Étape 3/7 : PLAYLISTS"
./scripts/playlists.sh

# 4. SOCIAL (Dépend de TMDB et AUTH)
echo "➡️ Étape 4/7 : SOCIAL"
./scripts/social.sh

# 5. FEED (Dépend de PLAYLISTS et SOCIAL)
echo "➡️ Étape 5/7 : FEED"
./scripts/feed.sh

# 6. STORAGE (Médias S3)
echo "➡️ Étape 6/7 : STORAGE (S3 -> MinIO)"
./scripts/storage.sh

# 7. UI (Dépend de TMDB)
echo "➡️ Étape 7/7 : UI"
./scripts/ui.sh

echo "==================================================="
echo "🎉 MIGRATION COMPLÈTE TERMINÉE AVEC SUCCÈS !"
echo "==================================================="
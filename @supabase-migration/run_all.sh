#!/bin/bash
set -e

# Charger les variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "==================================================="
echo "🚀 DÉMARRAGE DE LA MIGRATION GLOBALE"
echo "==================================================="

# ---------------------------------------------------------
# LE SECRET EST ICI : COUPER LES TRIGGERS GLOBALEMENT
# ---------------------------------------------------------
echo "🛑 Désactivation globale des triggers (Mode Replica)..."
psql "$TARGET_DATABASE_URL" -c "ALTER USER current_user SET session_replication_role = 'replica';"

# SÉCURITÉ : Si le script plante au milieu, cette ligne garantit 
# que les triggers seront rallumés quoi qu'il arrive à la fermeture du script.
trap 'echo "🔄 Réactivation automatique des triggers (Sécurité)..."; psql "$TARGET_DATABASE_URL" -c "ALTER USER current_user RESET session_replication_role;"' EXIT
# ---------------------------------------------------------

# Rendre tous les scripts exécutables
chmod +x scripts/*.sh

# 1. TMDB
echo "➡️ Étape 1/7 : TMDB"
./scripts/tmdb.sh

# 2. AUTH
echo "➡️ Étape 2/7 : AUTH"
./scripts/auth.sh

# 3. PLAYLISTS
echo "➡️ Étape 3/7 : PLAYLISTS"
./scripts/playlists.sh

# 4. SOCIAL
echo "➡️ Étape 4/7 : SOCIAL"
./scripts/social.sh

# 5. FEED
echo "➡️ Étape 5/7 : FEED"
./scripts/feed.sh

# 6. STORAGE
echo "➡️ Étape 6/7 : STORAGE (S3 -> MinIO)"
./scripts/storage.sh

# 7. UI
echo "➡️ Étape 7/7 : UI"
./scripts/ui.sh

# ---------------------------------------------------------
# RÉACTIVATION DES TRIGGERS À LA FIN (Géré par le trap, mais on peut le forcer)
# ---------------------------------------------------------
echo "✅ Réactivation globale des triggers..."
psql "$TARGET_DATABASE_URL" -c "ALTER USER current_user RESET session_replication_role;"
trap - EXIT

echo "==================================================="
echo "🎉 MIGRATION COMPLÈTE TERMINÉE AVEC SUCCÈS !"
echo "==================================================="
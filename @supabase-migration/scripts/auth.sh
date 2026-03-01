#!/bin/bash
set -e

# Charger les variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

SOURCE_DB=$SOURCE_DATABASE_URL
TARGET_DB=$TARGET_DATABASE_URL

# Fonction helper pour exécuter le pipe
migrate_query_to_table() {
    local NAME=$1
    local SOURCE_SQL=$2
    local TARGET_TABLE=$3
    local TARGET_COLS=$4

    echo "---------------------------------------------------"
    echo "🚀 Migration : $NAME -> $TARGET_TABLE"
    
    echo "   🧹 Truncate cible..."
    # Retrait de 'SET session_replication_role = replica'
    psql "$TARGET_DB" -c "TRUNCATE TABLE $TARGET_TABLE CASCADE;" > /dev/null

    echo "   🌊 Streaming des données..."
    # Retrait de 'SET session_replication_role = replica' dans la commande cible
    psql "$SOURCE_DB" -c "COPY ($SOURCE_SQL) TO STDOUT WITH (FORMAT BINARY)" | \
    psql "$TARGET_DB" -c "COPY $TARGET_TABLE ($TARGET_COLS) FROM STDIN WITH (FORMAT BINARY)"

    if [ $? -eq 0 ]; then
        echo "   ✅ Terminé."
    else
        echo "   ❌ Erreur."
        exit 1
    fi
}

echo "🎬 Démarrage de la migration SUPABASE AUTH vers BETTER AUTH..."

# ==============================================================================
# 1. MIGRATION DES UTILISATEURS (Fusion auth.users + public.user)
# ==============================================================================
# L'ordre est CRITIQUE ici car les contraintes sont actives.
# On doit créer les users AVANT les profils et les comptes.

SQL_USERS="
SELECT 
    au.id,                                      -- id
    COALESCE(pu.full_name, 'Unknown'),          -- name
    au.email,                                   -- email
    (au.email_confirmed_at IS NOT NULL),        -- emailVerified (boolean)
    pu.avatar_url,                              -- image
    au.created_at,                              -- createdAt
    au.updated_at,                              -- updatedAt
    LOWER(pu.username),                         -- username (FORCE EN MINUSCULE)
    pu.username,                                -- displayUsername
    pu.username_updated_at,                     -- usernameUpdatedAt
    COALESCE(pu.language, 'en-US')              -- language <-- AJOUT ICI (fallback si NULL)
FROM auth.users au
JOIN public.user pu ON au.id = pu.id
"

migrate_query_to_table \
    "Supabase Users" \
    "$SQL_USERS" \
    "auth.user" \
    "id, name, email, email_verified, image, created_at, updated_at, username, display_username, username_updated_at, language"

# ==============================================================================
# 2. MIGRATION DES PROFILS (Table public.profile)
# ==============================================================================

SQL_PROFILE="
SELECT 
    id,                 -- id (FK user)
    bio,                -- bio
    background_url,     -- backgroundImage
    premium,            -- isPremium
    private,            -- isPrivate
    followers_count,    -- followersCount
    following_count     -- followingCount
FROM public.user
"

migrate_query_to_table \
    "Public Profiles" \
    "$SQL_PROFILE" \
    "public.profile" \
    "id, bio, background_image, is_premium, is_private, followers_count, following_count"


# ==============================================================================
# 3. MIGRATION DES MOTS DE PASSE (Création de comptes 'credential')
# ==============================================================================

SQL_ACCOUNTS_PWD="
SELECT 
    gen_random_uuid()::text,    -- id
    email,                      -- accountId
    'credential',               -- providerId
    id,                         -- userId
    encrypted_password,         -- password
    created_at,                 -- createdAt
    updated_at                  -- updatedAt
FROM auth.users
WHERE encrypted_password IS NOT NULL
"

migrate_query_to_table \
    "Passwords (Credentials)" \
    "$SQL_ACCOUNTS_PWD" \
    "auth.account" \
    "id, account_id, provider_id, user_id, password, created_at, updated_at"


# ==============================================================================
# 4. MIGRATION DES OAUTH (Google, Github, etc.)
# ==============================================================================

SQL_ACCOUNTS_OAUTH="
SELECT 
    id::text,                           -- id
    COALESCE(identity_data->>'sub', id::text), -- accountId
    provider,                           -- providerId
    user_id,                            -- userId
    NULL,                               -- password
    created_at,                         -- createdAt
    updated_at                          -- updatedAt
FROM auth.identities
"

echo "---------------------------------------------------"
echo "🚀 Migration : Supabase Identities -> auth.account (OAuth)"
echo "   🌊 Streaming des données (APPEND)..."

# Retrait de 'SET session_replication_role = replica' ici aussi
psql "$SOURCE_DB" -c "COPY ($SQL_ACCOUNTS_OAUTH) TO STDOUT WITH (FORMAT BINARY)" | \
psql "$TARGET_DB" -c "COPY auth.account (id, account_id, provider_id, user_id, password, created_at, updated_at) FROM STDIN WITH (FORMAT BINARY)"

echo "   ✅ Terminé."

echo "---------------------------------------------------"
echo "🎉 Migration AUTH complète terminée."
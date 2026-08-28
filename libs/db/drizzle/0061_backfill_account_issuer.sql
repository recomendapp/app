-- Custom SQL migration file, put your code below! --

-- better-auth 1.7 introduced a required "issuer" column on the account table, used to
-- identify which authentication method/provider owns an account. External accounts are
-- now looked up by the pair (issuer, account_id) instead of account_id alone, so backfill
-- must use the *exact* issuer value better-auth assigns to each provider -- never a
-- guessed synthetic fallback -- or the next sign-in through a mis-tagged provider won't
-- find this row and linkAccount() will create a duplicate account for the same user.
--
-- Verified against the installed @better-auth/core@1.7.2 source (grep `accountIssuer:` in
-- node_modules/@better-auth/core/dist/social-providers/<provider>.mjs), not assumed:
--   - "credential" (password AND the email-otp plugin -- see
--     .../plugins/email-otp/routes.mjs, both create accounts with
--     provider_id = 'credential') -> createLocalAccountIssuer('credential')
--     = 'local:credential'
--   - google declares accountIssuer: 'https://accounts.google.com'
--   - apple declares accountIssuer: 'https://appleid.apple.com'
--   - facebook declares accountIssuer: 'https://www.facebook.com'
--   - github does NOT declare an accountIssuer, so it falls back to the synthetic
--     createOAuthAccountIssuer('github') = 'local:oauth:github'
--
-- If this app is ever configured with an OAuth provider not listed here, do NOT assume
-- the 'local:oauth:<provider>' fallback applies -- grep the provider's own source file
-- first, since a provider declaring its own issuer must use that exact value instead.
-- The guard below aborts the migration if it finds a provider_id it doesn't recognize,
-- rather than silently guessing.
--
-- provider_id = 'email' is a known, deliberately-excluded case, not an oversight: this
-- app was migrated from Supabase Auth (see @supabase-migration/scripts/auth.sh). Supabase
-- creates a synthetic 'email' identity in auth.identities for every email/password user
-- in addition to their real credential row, and that migration script copied it over
-- verbatim. Confirmed on the restored prod dump: every 'email' row has account_id =
-- user_id, no password/tokens, and a sibling provider_id = 'credential' row for the same
-- user_id -- a dead duplicate, never read by any current better-auth code path (grepped
-- the whole better-auth source: nothing queries provider_id = 'email'). Delete them
-- rather than inventing a synthetic issuer for them, which would make them look like a
-- real linked provider (e.g. in listAccounts()) instead of Supabase migration noise.
DELETE FROM "auth"."account" WHERE "provider_id" = 'email';
--> statement-breakpoint
DO $$
DECLARE
  unexpected text;
BEGIN
  SELECT string_agg(DISTINCT provider_id, ', ')
  INTO unexpected
  FROM "auth"."account"
  WHERE provider_id NOT IN ('credential', 'google', 'apple', 'facebook', 'github');

  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION
      'Unexpected provider_id(s) in auth.account: %. Verify accountIssuer for each in @better-auth/core/dist/social-providers/*.mjs and add it to the backfill CASE below before re-running this migration.',
      unexpected;
  END IF;
END $$;
--> statement-breakpoint
UPDATE "auth"."account"
SET "issuer" = CASE "provider_id"
  WHEN 'credential' THEN 'local:credential'
  WHEN 'google' THEN 'https://accounts.google.com'
  WHEN 'apple' THEN 'https://appleid.apple.com'
  WHEN 'facebook' THEN 'https://www.facebook.com'
  WHEN 'github' THEN 'local:oauth:github'
END
WHERE "issuer" IS NULL;

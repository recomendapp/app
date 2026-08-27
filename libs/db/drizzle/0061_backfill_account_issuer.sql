-- Custom SQL migration file, put your code below! --

-- better-auth 1.7 introduced a required "issuer" column on the account table,
-- used to identify which authentication method/provider owns an account.
-- Backfill existing rows using the same synthetic issuer values better-auth
-- itself assigns for new accounts (see @better-auth/core/db):
--   - createLocalAccountIssuer(providerId)  -> `local:${providerId}`
--   - createOAuthAccountIssuer(providerId)  -> `local:oauth:${providerId}`
-- "credential" is the only local (non-OAuth) provider id used in this app
-- (email/password sign-up and the email-otp plugin both create accounts with
-- provider_id = 'credential'); every other provider_id is an OAuth provider.
UPDATE "auth"."account"
SET "issuer" = CASE
  WHEN "provider_id" = 'credential' THEN 'local:credential'
  ELSE 'local:oauth:' || "provider_id"
END
WHERE "issuer" IS NULL;

-- Repair credential accounts before the unique index can rely on them: better-auth's own
-- account-creation code (password sign-up and the email-otp plugin, see
-- better-auth/dist/db/internal-adapter.mjs and .../plugins/email-otp/routes.mjs) always
-- sets account_id = user_id for provider_id = 'credential', and findCredentialAccount()
-- requires that exact match to find the row again at sign-in. Any row where they've
-- drifted apart is already broken today (password sign-in fails with
-- INVALID_EMAIL_OR_PASSWORD); this repairs it instead of leaving it masked until the
-- (issuer, account_id) unique index below also can't find the row.
UPDATE "auth"."account"
SET "account_id" = "user_id"::text
WHERE "provider_id" = 'credential' AND "account_id" <> "user_id"::text;

-- Detect (issuer, account_id) collisions before the unique index is created. Two rows
-- sharing that pair but belonging to the SAME user are safe to merge (keep the most
-- recently updated one, drop the other, below). Two rows sharing that pair but belonging
-- to DIFFERENT users means two accounts are claiming the same external identity -- that
-- must never be auto-merged (would let one user hijack another user's OAuth identity), so
-- abort and require manual investigation instead.
DO $$
DECLARE
  cross_user_collisions int;
BEGIN
  SELECT count(*) INTO cross_user_collisions
  FROM (
    SELECT issuer, account_id
    FROM "auth"."account"
    GROUP BY issuer, account_id
    HAVING count(DISTINCT user_id) > 1
  ) collisions;

  IF cross_user_collisions > 0 THEN
    RAISE EXCEPTION
      '% (issuer, account_id) pair(s) are claimed by more than one user_id -- resolve manually before this migration can run (never auto-merge by provider identity across different users).',
      cross_user_collisions;
  END IF;
END $$;

-- Same-user duplicates (e.g. created by the pre-fix backfill mis-tagging a provider's
-- issuer, so a later real sign-in via linkAccount() created a second row): keep the most
-- recently updated row per (issuer, account_id, user_id), drop the rest.
DELETE FROM "auth"."account" a
USING "auth"."account" b
WHERE a.issuer = b.issuer
  AND a.account_id = b.account_id
  AND a.user_id = b.user_id
  AND (a.updated_at, a.id) < (b.updated_at, b.id);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "auth"."account" USING btree ("issuer","account_id");

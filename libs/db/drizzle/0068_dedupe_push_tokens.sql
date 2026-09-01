-- Custom SQL migration file, put your code below! --

-- Root cause of duplicate push notifications: the previous unique constraint on
-- push_token was (session_id, provider), not the actual device token. Every time a
-- browser/app re-authenticates (session refresh, re-login, cookie rotation) the same
-- physical FCM/APNs token gets re-registered under a brand new session_id, leaving the
-- old row in place. A user ends up with several rows carrying the *identical* token
-- string, so notify.processor.ts's `inArray(pushToken.userId, ...)` lookup returns that
-- same token multiple times and the device receives the same push 2-4x.
--
-- Verified on a prod DB copy: 13 of 25 users had duplicate (user_id, token, provider)
-- rows, one with 10 rows for a single physical token, across both fcm and apns.
--
-- Before the next migration can add a unique constraint on (user_id, token, provider),
-- existing duplicates must be collapsed to one row each. Keep the row most recently
-- touched (updated_at) as the best signal of which session_id is still active; ties
-- broken by created_at then id for determinism. Session/device metadata (device_type)
-- travels with whichever row survives -- it does not vary across the duplicates in
-- practice (same physical device), so no merge logic is needed there.
DELETE FROM "push_token" pt
USING (
  SELECT id,
    row_number() OVER (
      PARTITION BY user_id, token, provider
      ORDER BY updated_at DESC, created_at DESC, id
    ) AS rn
  FROM "push_token"
) ranked
WHERE pt.id = ranked.id
  AND ranked.rn > 1;

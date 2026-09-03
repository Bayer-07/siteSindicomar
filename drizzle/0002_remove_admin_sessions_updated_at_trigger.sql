-- admin_sessions intentionally has no updated_at column. Session activity is
-- tracked by last_seen_at, so the generic updated_at trigger must not run here.
DROP TRIGGER IF EXISTS admin_sessions_updated_at ON admin_sessions;

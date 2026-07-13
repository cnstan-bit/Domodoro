# Domodoro Squad Backend

Squads are optional. The timer, overlays, history, insights, and share cards work without a cloud account.

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_social.sql` in the SQL editor.
3. Enable email OTP. Optionally enable GitHub OAuth.
4. Add `domodoro://auth/callback` to the redirect allow list.
5. Copy `src/config/social-config.example.json` to `src/config/social-config.json` and add the project URL and public anon key.
6. Rebuild Domodoro.

## Privacy Boundary

Synced: daily focus minutes, focus session count, break minutes, completed breaks, bypass count, and balance score.

Local only: task labels, task categories, bypass reasons, exact timestamps, overlay choices, and persona choices.

Squads are limited to 12 members. The first version intentionally excludes public feeds, free-text chat, and global leaderboards.

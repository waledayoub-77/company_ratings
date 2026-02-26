const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;

// Backend services should use the Service Role Key so that Row Level Security
// (RLS) does not block server-side reads/writes.
// Fall back to SUPABASE_ANON_KEY for older deployments that haven't added the
// service role key yet.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to SUPABASE_ANON_KEY.\n" +
    "   Row Level Security policies may block server-side writes (e.g. profile updates).\n" +
    "   Add SUPABASE_SERVICE_ROLE_KEY to your .env file to fix this."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Service role clients should not persist sessions or auto-refresh tokens
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ref = SUPABASE_URL.replace('https://', '').split('.')[0];

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Check if columns already exist
  const { error } = await supabase
    .from('job_applications')
    .select('invite_sent_at')
    .limit(1);

  if (!error) {
    console.log('✅ invite_sent_at column already exists — migration not needed.');
    return;
  }

  console.log('❌ Columns do not exist yet.');
  console.log('\n📋 Please run the following SQL in your Supabase SQL Editor:');
  console.log(`   URL: https://supabase.com/dashboard/project/${ref}/sql/new\n`);
  console.log('--- SQL TO RUN ---');
  console.log('ALTER TABLE job_applications');
  console.log('  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ,');
  console.log('  ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMPTZ;');
  console.log('--- END SQL ---\n');
  console.log('After running, the invite feature will be fully functional.');
}

main().catch(console.error);

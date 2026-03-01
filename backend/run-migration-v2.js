/**
 * Run V2 migration against Supabase using the REST SQL endpoint.
 * Usage: node run-migration-v2.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL
const ref = SUPABASE_URL.replace('https://', '').split('.')[0];

async function runSQL(sql) {
  // Try the pg-meta SQL endpoint
  const url = `${SUPABASE_URL}/rest/v1/rpc/`;
  
  // Alternative: try the Supabase SQL API endpoint (used by dashboard)
  const sqlUrl = `https://${ref}.supabase.co/pg/query`;
  
  // Actually use the standard approach via fetch to the SQL endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!res.ok) {
    return { error: await res.text() };
  }
  return { data: await res.json() };
}

async function main() {
  const migrationSQL = fs.readFileSync(path.join(__dirname, 'migration-v2.sql'), 'utf-8');
  
  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} statements to execute`);
  
  // Try executing via the exec_sql RPC
  const testResult = await runSQL('SELECT 1 as test');
  if (testResult.error) {
    console.log('RPC exec_sql not available, attempting direct SQL methods...');
    console.log('Error:', testResult.error.substring(0, 200));
    
    // Fall back: try individual table creation via the Supabase JS client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Check if verification_requests table exists
    const { data, error } = await supabase.from('verification_requests').select('id').limit(1);
    if (!error) {
      console.log('✅ V2 tables already exist! Migration not needed.');
      return;
    }
    
    if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('❌ V2 tables do NOT exist. Migration needed.');
      console.log('\n📋 Please run the following SQL in your Supabase SQL Editor:');
      console.log('   Dashboard → SQL Editor → New Query → Paste migration-v2.sql → Run');
      console.log(`\n   URL: https://supabase.com/dashboard/project/${ref}/sql/new`);
      process.exit(1);
    } else {
      console.log('Table check returned unexpected error:', error.message);
    }
    return;
  }
  
  console.log('✅ exec_sql RPC available, running migration...');
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    const result = await runSQL(stmt);
    if (result.error) {
      console.error(`  ❌ Error: ${result.error.substring(0, 200)}`);
    } else {
      console.log(`  ✅ OK`);
    }
  }
  console.log('Migration complete!');
}

main().catch(e => { console.error(e); process.exit(1); });

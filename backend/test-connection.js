// TEST FILE - Just to test database connection
// This file is TEMPORARY - you can delete it later

const { supabase } = require('./src/config/database');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  try {
    // Test 1: Check if supabase client is created
    console.log('✅ Supabase client created');
    console.log('📍 URL:', process.env.SUPABASE_URL);
    
    // Test 2: Try a simple query (get database time)
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('\n⚠️  Database connected but "companies" table does NOT exist yet');
      console.log('💡 You need to create the table in Supabase SQL Editor\n');
      return;
    }
    
    if (error) {
      console.log('\n❌ Database query error:', error.message);
      return;
    }
    
    console.log('✅ Database connected successfully!');
    console.log('✅ Companies table exists!');
    console.log('📊 Number of companies:', data ? data.length : 0);
    
    if (data && data.length > 0) {
      console.log('\n📋 First company:', data[0]);
    } else {
      console.log('\n📋 Companies table is empty (this is normal for new setup)');
    }
    
  } catch (err) {
    console.log('\n❌ Connection failed:', err.message);
  }
}

// Run the test
testConnection();

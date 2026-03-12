// Server Starter
require('dotenv').config();

const app = require('./app');
const supabase = require('./config/database');

const PORT = process.env.PORT || 5000;

async function ensureBuckets() {
  const buckets = ['documents'];
  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket, { public: false });
    if (error && error.message !== 'The resource already exists') {
      console.warn(`⚠️  Could not create bucket "${bucket}":`, error.message);
    } else if (!error) {
      console.log(`✅ Storage bucket "${bucket}" created`);
    }
  }
}

app.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 API: http://localhost:${PORT}/api`);
  await ensureBuckets();
});
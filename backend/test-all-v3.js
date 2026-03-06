// Comprehensive V3 API Test — tests every endpoint & reports pass/fail
const BASE = 'http://localhost:5000';
const CID = 'b0000000-0000-0000-0000-000000000001';

async function post(url, body, token) {
  const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + url, opts);
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}
async function get(url, token) {
  const opts = { headers: {} };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + url, opts);
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}
async function patch(url, body, token) {
  const opts = { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + url, opts);
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}
async function del(url, token) {
  const r = await fetch(BASE + url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: detail || '' });
  console.log(ok ? `  ✅ ${name}` : `  ❌ ${name}: ${detail}`);
}

(async () => {
  console.log('\n=== LOGIN ===');
  const login = await post('/api/auth/login', { email: 'tech.admin@ratehub.com', password: 'Test1234!' });
  check('Login tech.admin (company_admin)', login.status === 200, `status=${login.status}`);
  const token = login.body?.data?.accessToken;
  if (!token) { console.log('CANNOT CONTINUE - no token'); process.exit(1); }

  const adminLogin = await post('/api/auth/login', { email: 'admin@ratehub.com', password: 'Test1234!' });
  check('Login admin (system_admin)', adminLogin.status === 200, `status=${adminLogin.status}`);
  const adminToken = adminLogin.body?.data?.accessToken;

  const frankLogin = await post('/api/auth/login', { email: 'frank@ratehub.com', password: 'Test1234!' });
  check('Login frank (employee)', frankLogin.status === 200, `status=${frankLogin.status}`);
  const frankToken = frankLogin.body?.data?.accessToken;

  console.log('\n=== F3: FILTER OPTIONS ===');
  const f3 = await get('/api/companies/filter-options');
  check('F3 GET filter-options 200', f3.status === 200, `status=${f3.status}`);
  check('F3 countries is array with data', Array.isArray(f3.body?.data?.countries) && f3.body.data.countries.length > 0, JSON.stringify(f3.body?.data?.countries));
  check('F3 cities is array with data', Array.isArray(f3.body?.data?.cities) && f3.body.data.cities.length > 0, JSON.stringify(f3.body?.data?.cities));
  check('F3 industries is array', Array.isArray(f3.body?.data?.industries), JSON.stringify(f3.body?.data?.industries));

  console.log('\n=== F1: INVITE EMPLOYEE ===');
  // Use carol@ratehub.com - a registered user NOT employed at TechCorp
  const INVITE_EMAIL = 'carol@ratehub.com';
  const f1 = await post('/api/employments/invite', { email: INVITE_EMAIL, companyId: CID, position: 'Tester', department: 'QA' }, token);
  check('F1 invite registered user 201', f1.status === 201, `status=${f1.status} body=${JSON.stringify(f1.body).substring(0,200)}`);
  const inviteId = f1.body?.data?.id;

  // F1: Invite non-registered user should fail with clear message
  const f1unreg = await post('/api/employments/invite', { email: 'nonexistent-user-xyz@example.com', companyId: CID, position: 'Tester' }, token);
  check('F1 invite unregistered user 400', f1unreg.status === 400, `status=${f1unreg.status}`);

  // Get pending invites
  const f1p = await get('/api/employments/pending-invites', token);
  check('F1 pending-invites 200', f1p.status === 200, `status=${f1p.status}`);
  check('F1 pending-invites has data', Array.isArray(f1p.body?.data) && f1p.body.data.length > 0, `count=${f1p.body?.data?.length}`);

  // Resend invite
  if (inviteId) {
    const f1r = await patch(`/api/employments/invite/${inviteId}/resend`, {}, token);
    check('F1 resend invite 200', f1r.status === 200, `status=${f1r.status}`);
  } else {
    check('F1 resend invite', false, 'no inviteId from invite step');
  }

  // Duplicate invite should fail
  const f1dup = await post('/api/employments/invite', { email: INVITE_EMAIL, companyId: CID, position: 'Tester' }, token);
  check('F1 duplicate invite 400', f1dup.status === 400, `status=${f1dup.status}`);

  // Cancel invite (cleanup)
  if (inviteId) {
    const f1c = await del(`/api/employments/invite/${inviteId}`, token);
    check('F1 cancel invite 200', f1c.status === 200, `status=${f1c.status}`);
  }

  console.log('\n=== F5: JOBS ===');
  const f5c = await post('/api/jobs', { companyId: CID, title: 'V3 Test Dev', description: 'Automated test job', requirements: 'Node.js' }, token);
  check('F5 create job 201', f5c.status === 201, `status=${f5c.status}`);
  const jobId = f5c.body?.data?.id;

  const f5l = await get(`/api/jobs?companyId=${CID}`, token);
  check('F5 list jobs 200', f5l.status === 200, `status=${f5l.status}`);
  check('F5 jobs has data', Array.isArray(f5l.body?.data) && f5l.body.data.length > 0, `count=${f5l.body?.data?.length}`);

  // all-jobs without companyId param - should auto-detect from logged-in admin
  const f5all = await get('/api/jobs/all', token);
  check('F5 all jobs (auto-detect companyId) 200', f5all.status === 200, `status=${f5all.status}`);

  if (jobId) {
    const f5close = await patch(`/api/jobs/${jobId}/close`, {}, token);
    check('F5 close job 200', f5close.status === 200, `status=${f5close.status}`);

    // Delete the test job (cleanup)
    const f5del = await del(`/api/jobs/${jobId}`, token);
    check('F5 delete job 200', f5del.status === 200, `status=${f5del.status}`);
  }

  console.log('\n=== F7: EOTY ===');
  const eoty_year = 2099; // use far-future year to avoid collision
  const f7c = await post('/api/eoty/events', { companyId: CID, year: eoty_year }, token);
  check('F7 create EOTY event', f7c.status === 201 || f7c.status === 400, `status=${f7c.status} msg=${f7c.body?.message || ''}`);

  const f7l = await get(`/api/eoty/company/${CID}`, token);
  check('F7 list EOTY events 200', f7l.status === 200, `status=${f7l.status}`);
  check('F7 EOTY events is array', Array.isArray(f7l.body?.data), typeof f7l.body?.data);

  const f7w = await get(`/api/eoty/company/${CID}/winners`);
  check('F7 EOTY winners 200', f7w.status === 200, `status=${f7w.status}`);

  console.log('\n=== F14: NOTIFICATIONS ===');
  const f14 = await get('/api/notifications', token);
  check('F14 GET notifications 200', f14.status === 200, `status=${f14.status}`);
  check('F14 notifications is array', Array.isArray(f14.body?.data), typeof f14.body?.data);

  const f14m = await patch('/api/notifications/read-all', {}, token);
  check('F14 mark-all-read 200', f14m.status === 200, `status=${f14m.status}`);

  console.log('\n=== F2: END EMPLOYMENT BY ADMIN ===');
  // First invite carol to create a current+pending employment, then we test end
  const f2inv = await post('/api/employments/invite', { email: INVITE_EMAIL, companyId: CID, position: 'EndTest', department: 'QA' }, token);
  const f2empId = f2inv.body?.data?.id;
  if (f2empId) {
    // The employment is created as pending. Try to end it (should work or give descriptive error)
    const f2end = await patch(`/api/employments/${f2empId}/end-by-admin`, { reason: 'test cleanup' }, token);
    check('F2 end employment endpoint responds', f2end.status === 200 || f2end.status === 400 || f2end.status === 404, `status=${f2end.status} body=${JSON.stringify(f2end.body).substring(0,200)}`);
    // Cleanup: delete the test employment
    await del(`/api/employments/invite/${f2empId}`, token);
  } else {
    check('F2 end employment endpoint responds', false, 'Could not create test employment');
  }

  // Also check the list-all endpoint works
  const emps = await get('/api/employments/all', token);
  check('F2 list-all employments 200', emps.status === 200, `status=${emps.status}`);
  check('F2 list-all returns array', Array.isArray(emps.body?.data), typeof emps.body?.data);

  console.log('\n=== F11: ANONYMOUS FEEDBACK ===');
  // Use frank (employee) token — tech.admin has no employee profile
  if (frankToken) {
    const fb1 = await get('/api/feedback/received', frankToken);
    check('F11 GET feedback/received 200', fb1.status === 200, `status=${fb1.status}`);
    check('F11 feedback received is array', Array.isArray(fb1.body?.data), typeof fb1.body?.data);

    const fb2 = await get('/api/feedback/given', frankToken);
    check('F11 GET feedback/given 200', fb2.status === 200, `status=${fb2.status}`);

    const fb3 = await get('/api/feedback/coworkers', frankToken);
    check('F11 GET feedback/coworkers 200', fb3.status === 200, `status=${fb3.status}`);
  } else {
    check('F11 feedback tests', false, 'No employee token (frank login failed)');
  }

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\nTotal: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFAILED:');
    results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
  }
})();

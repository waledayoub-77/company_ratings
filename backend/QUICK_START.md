# 🚀 QUICK START GUIDE - Database Deployment

## ⚡ FAST TRACK (5 Minutes)

### **Step 1: Deploy Schema** (3 min)
1. Go to https://nfpeazirwxuwpjryvcny.supabase.co
2. Click **SQL Editor** → **New Query**
3. Copy contents of `database-schema.sql`
4. Paste and click **Run**
5. Wait for success message

### **Step 2: Disable RLS** (1 min)
1. Click **New Query** again
2. Copy contents of `disable-rls.sql`
3. Paste and click **Run**

### **Step 3: Test Connection** (1 min)
```bash
node test-database.js
```

Expected output:
```
✅ Supabase connection: Working
✅ Tables: Created
✅ Views: Created
✅ Functions: Working
✅ Insert/Delete: Working
```

---

## 📋 DETAILED DEPLOYMENT CHECKLIST

- [ ] **1. Open Supabase SQL Editor**
  - URL: https://nfpeazirwxuwpjryvcny.supabase.co
  - Navigate: SQL Editor (left sidebar)

- [ ] **2. Deploy Main Schema**
  - File: `database-schema.sql`
  - Action: Copy entire file → Paste → Run
  - Wait: ~20 seconds
  - Verify: Success message appears

- [ ] **3. Disable RLS**
  - File: `disable-rls.sql`
  - Action: Copy → Paste → Run
  - Why: Express middleware will handle auth

- [ ] **4. Verify Deployment (Optional)**
  - File: `verify-database.sql`
  - Action: Run each query section
  - Check: 10 tables, 3 views, 9 functions

- [ ] **5. Test Backend Connection**
  - Command: `node test-database.js`
  - Expected: All tests pass ✅

- [ ] **6. Confirm Server Still Running**
  - URL: http://localhost:5000/health
  - Expected: `{"success": true, ...}`

---

## 🎯 WHAT YOU GET

### **Tables (9 + 1 reference):**
```
users               ← Authentication
employees           ← Employee profiles
companies           ← Company profiles
employments         ← Employee↔Company junction (with verification)
company_reviews     ← Public reviews
employee_feedback   ← Private peer feedback
reported_reviews    ← Moderation system
audit_logs          ← Admin action tracking
refresh_tokens      ← JWT management
industries          ← Reference data (20 industries)
```

### **Smart Features:**
✅ **Auto-calculate company ratings** on review changes
✅ **Auto-set 48-hour edit deadline** for reviews
✅ **Auto-generate anonymous hash** for anonymous reviews
✅ **Auto-update timestamps** on all changes
✅ **Auto-calculate quarter/year** for feedback
✅ **Business rule validation** via constraints

### **Helper Functions:**
```sql
-- Check if can submit review
SELECT can_submit_review('employee_id', 'company_id');

-- Check if can submit feedback
SELECT can_submit_feedback('reviewer_id', 'rated_id', 'company_id');

-- Get company statistics
SELECT * FROM get_company_stats('company_id');
```

### **Views (for easy querying):**
```sql
-- Get all companies (public safe)
SELECT * FROM public_company_profiles;

-- Get reviews (anonymous safe)
SELECT * FROM public_company_reviews;

-- Get feedback summary
SELECT * FROM employee_feedback_summary;
```

---

## ⚠️ TROUBLESHOOTING

### **Error: "relation 'users' does not exist"**
**Solution:** Run `database-schema.sql` first

### **Error: "permission denied for table users"**
**Solution:** Run `disable-rls.sql` to disable Row Level Security

### **Error: "type 'user_role' already exists"**
**Solution:** Schema already deployed, skip to next step

### **Test fails: "Tables not created"**
**Solution:** 
1. Check Supabase dashboard → Table Editor
2. Verify tables appear in left sidebar
3. If not, re-run `database-schema.sql`

### **Test fails: "permission denied"**
**Solution:** Run `disable-rls.sql`

---

## ✅ SUCCESS CRITERIA

Before moving to auth development, verify:

- [ ] `node test-database.js` passes all tests
- [ ] Supabase Table Editor shows 10 tables
- [ ] Can insert and delete test user
- [ ] Server connects without errors
- [ ] Health endpoint responds: http://localhost:5000/health

---

## 📚 NEXT STEPS (After Database is Ready)

### **Day 1 Afternoon - Build Auth System:**

1. **Create `src/services/authService.js`**
   - `registerUser()` function
   - `loginUser()` function
   - Use bcrypt for password hashing
   - Generate JWT tokens

2. **Create `src/controllers/authController.js`**
   - `register()` controller
   - `login()` controller
   - Handle errors properly

3. **Create `src/routes/authRoutes.js`**
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - Apply validation middleware

4. **Update `src/routes/index.js`**
   - Uncomment auth routes

5. **Replace auth middleware stub**
   - Edit `src/middlewares/authMiddleware.js`
   - Uncomment production version

6. **Test with Postman/curl**
   - Register user
   - Login user
   - Get access token
   - Call protected route

---

## 🎓 LEARNING RESOURCES

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Functions:** https://www.postgresql.org/docs/current/sql-createfunction.html
- **Triggers:** https://www.postgresql.org/docs/current/sql-createtrigger.html
- **Full-text Search:** https://www.postgresql.org/docs/current/textsearch.html

---

## 🔥 PRO TIPS

1. **Use the helper functions** - They encapsulate business logic
2. **Leverage views** - Cleaner than complex JOINs in your code
3. **Trust the triggers** - No need to manually update ratings/timestamps
4. **Check constraints** - They enforce data integrity automatically
5. **Use transactions** - For multi-table operations

---

**You have a production-grade database! Time to build auth.** 🚀

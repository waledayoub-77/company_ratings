# 📚 AYA'S COMPLETE STUDY GUIDE - Days 0-4
## Company & Review System Implementation

> **Last Updated**: February 21, 2026 08:00 PM  
> **Status**: ALL DAYS 0-4 COMPLETE ✅  
> **Author**: Aya  
> **Module**: Companies & Reviews

---

## 🎯 WHAT I COMPLETED

### Days 0-2: Foundation
✅ Full CRUD for companies  
✅ Full CRUD for reviews  
✅ Employment verification before review  
✅ Duplicate review prevention  
✅ Automatic company rating calculation  

### Days 3-4: Advanced Features
✅ Review editing (48-hour window)  
✅ My reviews page  
✅ Company review list with sorting  
✅ Anonymous review handling  
✅ Company analytics (rating distribution + trends)  

---

## 📁 FILES I CREATED

### 1. **companyService.js** (283 lines)
**Location**: `backend/src/services/companyService.js`

**Purpose**: All business logic for company operations

**Functions** (7 total):

#### `getCompanies(filters)` - List Companies
```javascript
// What it does:
// - Gets all non-deleted companies from database
// - Filters by: industry, location, minRating, search term
// - Supports pagination (page, limit)
// - Supports sorting (sortBy, sortOrder)
// - Returns: companies array + pagination info

// How it works:
1. Builds Supabase query starting with .is('deleted_at', null)
2. Applies filters if provided (eq, ilike, gte for ratings)
3. Searches name OR description if search term provided
4. Sorts results (default: created_at desc)
5. Calculates pagination offset and applies .range()
6. Returns companies + totalPages, total count

// Key learning: Chain Supabase queries, use count:'exact' for pagination
```

#### `getCompanyById(companyId)` - Get Single Company
```javascript
// What it does:
// - Retrieves one company by ID
// - Only returns non-deleted companies
// - Throws 404 if not found

// How it works:
1. Query companies table
2. Filter by id AND deleted_at is null
3. Use .single() to get one result
4. If error or no data, throw AppError 404

// Key learning: Always check deleted_at in WHERE clauses
```

#### `createCompany(companyData, userId)` - Create Company
```javascript
// What it does:
// - Creates new company profile
// - Checks for duplicate names
// - Links to user who created it

// How it works:
1. Check if company name already exists (case-sensitive)
2. If exists, throw AppError 400 (duplicate)
3. Insert new company with user_id
4. Return created company data

// Key learning: Always validate uniqueness before insert
```

#### `updateCompany(companyId, updates, userId, userRole)` - Update Company
```javascript
// What it does:
// - Updates company details
// - Permission check: only creator or system_admin
// - Validates new name doesn't conflict

// How it works:
1. Get company by ID (verify exists)
2. Check if user_id matches userId OR role is system_admin
3. If changing name, check no other company has that name
4. Update company fields
5. Return updated data

// Key learning: Always check permissions before mutations
```

#### `deleteCompany(companyId, userId, userRole)` - Soft Delete
```javascript
// What it does:
// - Soft deletes company (sets deleted_at timestamp)
// - Permission check like update

// How it works:
1. Get company (verify exists + permissions)
2. Set deleted_at = current timestamp
3. Company hidden from all queries with .is('deleted_at', null)

// Key learning: Soft delete preserves data for auditing
```

#### `getCompanyStats(companyId)` - Company Statistics
```javascript
// What it does:
// - Calls database function get_company_stats()
// - Returns review counts and ratings breakdown

// How it works:
1. Verify company exists
2. Call Supabase RPC function: .rpc('get_company_stats', { p_company_id: id })
3. Database returns: total_reviews, avg_rating, 5-star count, 4-star, 3, 2, 1

// Key learning: Use DB functions for complex aggregations
```

#### `getCompanyAnalytics(companyId)` - Analytics (Days 3-4)
```javascript
// What it does:
// - Rating distribution: how many 1-star, 2-star, etc.
// - Reviews over time: monthly breakdown

// How it works:
1. Get all company reviews (overall_rating field)
2. Loop through and count each rating (1-5)
3. Get all reviews with created_at timestamps
4. Group by year-month (e.g., "2026-02")
5. Return distribution object + monthly data object

// Example output:
{
  ratingDistribution: { 1: 5, 2: 12, 3: 45, 4: 78, 5: 120 },
  reviewsOverTime: { "2026-01": 34, "2026-02": 56 },
  totalReviews: 260
}

// Key learning: Client-side aggregation for flexible data shaping
```

---

### 2. **reviewService.js** (400 lines)
**Location**: `backend/src/services/reviewService.js`

**Purpose**: All business logic for review operations

**Functions** (10 total):

#### `checkVerifiedEmployment(employeeId, companyId)` - Helper
```javascript
// What it does:
// - Checks if employee has approved employment at company

// How it works:
1. Query employments table
2. Filter by employee_id, company_id, verification_status='approved', deleted_at null
3. Return true if exists, false otherwise

// Key learning: Helper functions for reusable business rules
```

#### `checkDuplicateReview(employeeId, companyId)` - Helper
```javascript
// What it does:
// - Prevents multiple reviews from same employee for same company

// How it works:
1. Query company_reviews table
2. Filter by employee_id, company_id, deleted_at null
3. Return true if exists (duplicate), false if OK

// Business rule: One review per employee per company (enforced)
```

#### `recalculateCompanyRating()` - Helper
```javascript
// What it does:
// - Updates company overall_rating and total_reviews after review changes

// How it works:
1. Get all non-deleted reviews for company
2. If no reviews: set overall_rating=null, total_reviews=0
3. If reviews exist: calculate average of overall_rating
4. Update company table with new average and count

// Key learning: Always update aggregates after data changes
// Called after: create review, update review, delete review
```

#### `createReview(reviewData, userId)` - Submit Review
```javascript
// What it does:
// - Creates new company review
// - Enforces: verified employment + no duplicates

// How it works:
1. Get employee ID from user ID (join users -> employees)
2. Check verified employment (else throw 403)
3. Check duplicate review (else throw 400)
4. Get employment_id (required FK)
5. Insert review with: employee_id, company_id, employment_id, overall_rating, content, is_anonymous
6. DB trigger sets can_edit_until = NOW() + 48 hours
7. DB trigger generates anonymous_author_hash if is_anonymous=true
8. Recalculate company rating
9. Return created review

// Key learning: Business rules enforced before DB insert
```

#### `updateReview(reviewId, updates, userId)` - Edit Review (Days 3-4)
```javascript
// What it does:
// - Updates review content/rating
// - Only within 48 hours of creation
// - Only by review author

// How it works:
1. Get employee ID from user ID
2. Get review by ID (deleted_at null)
3. Check ownership: review.employee_id === employee.id
4. Check 48hr window: now <= review.can_edit_until
5. Update overall_rating and content
6. Set edited_at = NOW()
7. If rating changed, recalculate company rating

// Key learning: Time-based permissions (48hr window)
```

#### `deleteReview(reviewId, userId, userRole)` - Delete Review
```javascript
// What it does:
// - Soft deletes review
// - Permission: owner or system_admin

// How it works:
1. Get employee ID
2. Get review
3. Check ownership OR admin role
4. Set deleted_at = NOW()
5. Recalculate company rating (review no longer counts)

// Key learning: Role-based permissions (owner OR admin)
```

#### `getCompanyReviews(companyId, filters)` - List Reviews (Days 3-4)
```javascript
// What it does:
// - Gets all reviews for a company
// - Supports sorting and pagination
// - Hides identity of anonymous reviewers

// How it works:
1. Query public_company_reviews VIEW (not direct table)
2. View automatically hides employee info if is_anonymous=true
3. Sort by: created_at OR overall_rating
4. Support sortOrder: asc or desc
5. Paginate results
6. Return reviews + pagination

// Key learning: Use database views for complex access control
```

#### `getMyReviews(userId, filters)` - My Reviews (Days 3-4)
```javascript
// What it does:
// - Gets all reviews written by current user
// - Includes company info (name, logo)

// How it works:
1. Get employee ID from user ID
2. Query company_reviews table
3. Join with companies table: companies:company_id (id, name, logo_url)
4. Filter by employee_id
5. Order by created_at DESC (newest first)
6. Paginate
7. Return reviews with nested company data

// Key learning: Supabase select() supports joins and nested objects
```

#### `getReviewById(reviewId)` - Single Review
```javascript
// What it does:
// - Gets one review by ID

// Self-explanatory, standard CRUD operation
```

#### `reportReview(reviewId, reportData, userId)` - Report Review
```javascript
// What it does:
// - Allows users to report inappropriate reviews

// How it works:
1. Verify review exists
2. Insert into reported_reviews table
3. Fields: reporter_id, review_id, reason, description
4. Status defaults to 'pending' (for admin review)

// Key learning: Moderation system for user-generated content
```

---

### 3. **companyController.js** (156 lines)
**Location**: `backend/src/controllers/companyController.js`

**Purpose**: HTTP request handlers for company endpoints

**Pattern**: All controllers follow same pattern:
```javascript
async (req, res, next) => {
  try {
    // 1. Extract data from req (params, query, body, user)
    // 2. Call service function
    // 3. Return JSON response with success: true
  } catch (error) {
    // 4. Pass errors to errorHandler middleware
    next(error);
  }
}
```

**7 Endpoints**:
1. `getCompanies` → GET /companies (filters from query string)
2. `getCompanyById` → GET /companies/:id
3. `createCompany` → POST /companies (auth required)
4. `updateCompany` → PATCH /companies/:id (auth required)
5. `deleteCompany` → DELETE /companies/:id (auth required)
6. `getCompanyStats` → GET /companies/:id/stats
7. `getCompanyAnalytics` → GET /companies/:id/analytics (Days 3-4)

**Key learning**: Controllers are thin - just HTTP layer, business logic in services

---

### 4. **reviewController.js** (173 lines)
**Location**: `backend/src/controllers/reviewController.js`

**7 Endpoints**:
1. `createReview` → POST /reviews (employee only)
2. `updateReview` → PATCH /reviews/:id (Days 3-4)
3. `deleteReview` → DELETE /reviews/:id
4. `getCompanyReviews` → GET /companies/:companyId/reviews (Days 3-4)
5. `getMyReviews` → GET /reviews/my-reviews (Days 3-4)
6. `getReviewById` → GET /reviews/:id
7. `reportReview` → POST /reviews/:id/report

**Same pattern as companyController - thin HTTP layer**

---

### 5. **companyRoutes.js** (65 lines)
**Location**: `backend/src/routes/companyRoutes.js`

**Purpose**: Maps HTTP methods + paths to controllers + middleware

**Route Structure**:

```javascript
// PUBLIC ROUTES (no auth)
GET    /companies              → getCompanies
GET    /companies/:id          → getCompanyById
GET    /companies/:companyId/reviews → getCompanyReviews (Days 3-4)
GET    /companies/:id/analytics → getCompanyAnalytics (Days 3-4)
GET    /companies/:id/stats    → getCompanyStats

// PROTECTED ROUTES (requireAuth)
POST   /companies              → requireAuth + requireCompanyAdmin + createCompany
PATCH  /companies/:id          → requireAuth + updateCompany
DELETE /companies/:id          → requireAuth + deleteCompany
```

**Key learning**:
- Public endpoints first (company list, reviews)
- Protected endpoints require auth middleware
- Role-based middleware (requireCompanyAdmin)

---

### 6. **reviewRoutes.js** (52 lines)
**Location**: `backend/src/routes/reviewRoutes.js`

**Route Structure**:

```javascript
// ALL REQUIRE AUTH
POST   /reviews                → requireAuth + requireEmployee + createReview
GET    /reviews/my-reviews     → requireAuth + getMyReviews (Days 3-4)
GET    /reviews/:id            → getReviewById (public read)
PATCH  /reviews/:id            → requireAuth + updateReview (Days 3-4)
DELETE /reviews/:id            → requireAuth + deleteReview
POST   /reviews/:id/report     → requireAuth + reportReview
```

**Key learning**:
- Order matters: `/my-reviews` BEFORE `/:id` (otherwise matches as id)
- Employee role required for creating reviews

---

## 🔑 KEY CONCEPTS I LEARNED

### 1. **Soft Delete Pattern**
```javascript
// Instead of: DELETE FROM companies WHERE id = ?
// We do: UPDATE companies SET deleted_at = NOW() WHERE id = ?
// Then: WHERE deleted_at IS NULL (excludes deleted)

// Why?
- Data preservation for auditing
- Can "undelete" if needed
- Historical data analysis
```

### 2. **Permission Checking**
```javascript
// Pattern:
1. Get resource
2. Check: resource.user_id === currentUserId OR role === 'admin'
3. If not: throw AppError 403 Forbidden

// Learned: Always verify ownership before mutations
```

### 3. **Database Triggers**
```javascript
// DB does automatically:
- set can_edit_until = NOW() + 48 hours (on review insert)
- generate anonymous_author_hash (on review insert if is_anonymous)
- update companies.updated_at (on any column update)

// I don't have to do this in code!
```

### 4. **Aggregate Recalculation**
```javascript
// After review created/updated/deleted:
await recalculateCompanyRating(company_id)

// Keeps company.overall_rating and company.total_reviews in sync
// Alternative: Use DB triggers (but manual gives more control)
```

### 5. **Database Views for Security**
```javascript
// public_company_reviews VIEW:
IF review.is_anonymous THEN
  reviewer_name = NULL
  reviewer_position = NULL
ELSE
  reviewer_name = employee.full_name
  reviewer_position = employment.position

// Query the view instead of table → automatic anonymization
```

### 6. **Pagination Pattern**
```javascript
const page = req.query.page || 1;
const limit = req.query.limit || 10;
const offset = (page - 1) * limit;

query.range(offset, offset + limit - 1)

// Return:
{
  data: [...],
  pagination: {
    total: 500,
    page: 1,
    limit: 10,
    totalPages: 50
  }
}
```

### 7. **Error Handling Pattern**
```javascript
// In service:
throw new AppError('Message for user', statusCode);

// In controller:
catch (error) {
  next(error); // Passes to errorHandler middleware
}

// ErrorHandler middleware:
- Logs error
- Returns JSON with success: false
- Hides internal errors from users
```

---

## 🧪 HOW TO TEST ENDPOINTS

### **Before Testing**:
1. Server must be running: `cd backend && node src/server.js`
2. Database must be accessible (Supabase)
3. You need an access token for protected routes

### **Getting Access Token**:
```powershell
# 1. Register user
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User","role":"employee"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test123!"}'

# Response includes: accessToken
# Copy the token!
```

### **Test Scenarios**:

#### **Scenario 1: List All Companies**
```powershell
curl http://localhost:5000/api/companies

# With filters:
curl "http://localhost:5000/api/companies?industry=Technology&minRating=4&limit=5"

# With search:
curl "http://localhost:5000/api/companies?search=Tech"

# ✅ Expected: 200 OK, JSON with companies array + pagination
```

#### **Scenario 2: Get Single Company** 
```powershell
curl http://localhost:5000/api/companies/COMPANY_ID_HERE

# ✅ Expected: 200 OK, company object
# ❌ Expected: 404 if not found
```

#### **Scenario 3: Create Company (Protected)**
```powershell
$token = "YOUR_ACCESS_TOKEN"

curl -X POST http://localhost:5000/api/companies `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"name":"TechCorp","industry":"Technology","location":"San Francisco","description":"A tech company"}'

# ✅ Expected: 201 Created
# ❌ Expected: 401 if no token, 403 if not company_admin
```

#### **Scenario 4: Update Company**
```powershell
curl -X PATCH http://localhost:5000/api/companies/COMPANY_ID `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"description":"Updated description"}'

# ✅ Expected: 200 OK
# ❌ Expected: 403 if not creator or admin
```

#### **Scenario 5: Create Review (Days 0-2)**
```powershell
# Prerequisites:
# 1. User must be employee role
# 2. Must have approved employment at company
# 3. No existing review for this company

curl -X POST http://localhost:5000/api/reviews `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"company_id":"COMPANY_ID","overall_rating":5,"content":"Great company to work for! Amazing culture and benefits. Really enjoyed my time here and learned a lot.","is_anonymous":false}'

# ✅ Expected: 201 Created
# ❌ Expected: 403 if no employment, 400 if duplicate
```

#### **Scenario 6: Edit Review (Days 3-4)**
```powershell
# Must be within 48 hours of creation!

curl -X PATCH http://localhost:5000/api/reviews/REVIEW_ID `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"overall_rating":4,"content":"Updated: Still great but I realized some areas for improvement..."}'

# ✅ Expected: 200 OK
# ❌ Expected: 403 if >48hrs or not owner
```

#### **Scenario 7: Get My Reviews (Days 3-4)**
```powershell
curl http://localhost:5000/api/reviews/my-reviews `
  -H "Authorization: Bearer $token"

# ✅ Expected: 200 OK with reviews + company info
```

#### **Scenario 8: Get Company Reviews with Sorting (Days 3-4)**
```powershell
# Newest first:
curl "http://localhost:5000/api/companies/COMPANY_ID/reviews?sortBy=created_at&sortOrder=desc"

# Highest rated first:
curl "http://localhost:5000/api/companies/COMPANY_ID/reviews?sortBy=overall_rating&sortOrder=desc"

# Lowest rated first:
curl "http://localhost:5000/api/companies/COMPANY_ID/reviews?sortBy=overall_rating&sortOrder=asc"

# ✅ Expected: 200 OK, reviews sorted correctly
```

#### **Scenario 9: Company Analytics (Days 3-4)**
```powershell
curl http://localhost:5000/api/companies/COMPANY_ID/analytics

# ✅ Expected: 200 OK
# Response example:
{
  "success": true,
  "data": {
    "ratingDistribution": {
      "1": 2,
      "2": 5,
      "3": 15,
      "4": 45,
      "5": 33
    },
    "reviewsOverTime": {
      "2026-01": 20,
      "2026-02": 80
    },
    "totalReviews": 100
  }
}
```

#### **Scenario 10: Report Review**
```powershell
curl -X POST http://localhost:5000/api/reviews/REVIEW_ID/report `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"reason":"spam","description":"This review is clearly fake spam"}'

# ✅ Expected: 201 Created
```

---

## 📊 TESTING WITH POSTMAN (Recommended)

### **Setup**:
1. Download Postman: https://www.postman.com/downloads/
2. Create new Collection: "Company Ratings API"
3. Add environment variables:
   - `base_url`: http://localhost:5000/api
   - `access_token`: (will update after login)

### **Test Sequence**:

**1. Auth Tests**:
- POST {{base_url}}/auth/register
- POST {{base_url}}/auth/login → Save access_token
- GET {{base_url}}/auth/me (with Bearer token)

**2. Company Tests**:
- GET {{base_url}}/companies
- POST {{base_url}}/companies (save company_id)
- GET {{base_url}}/companies/:id
- PATCH {{base_url}}/companies/:id
- GET {{base_url}}/companies/:id/stats

**3. Review Tests** (requires employment setup first):
- POST {{base_url}}/reviews
- GET {{base_url}}/reviews/my-reviews
- PATCH {{base_url}}/reviews/:id (< 48hrs)
- GET {{base_url}}/companies/:companyId/reviews

**4. Analytics Tests** (Days 3-4):
- GET {{base_url}}/companies/:id/analytics

### **Postman Tips**:
- Use Tests tab to auto-save tokens: `pm.environment.set("access_token", data.accessToken)`
- Use Pre-request Scripts for timestamps
- Organize by folders: Auth, Companies, Reviews, Analytics

---

## 🐛 COMMON ERRORS & FIXES

### Error: "Review not found" (404)
**Cause**: Review was soft-deleted  
**Fix**: Check deleted_at IS NULL in query

### Error: "Column 'is_deleted' does not exist"
**Cause**: Wrong column name (DB uses deleted_at)  
**Fix**: Use .is('deleted_at', null)

### Error: "You must have verified employment"
**Cause**: No approved employment record  
**Fix**: Create employment and approve it first

### Error: "You have already reviewed this company"
**Cause**: Duplicate review prevention  
**Fix**: User can only submit one review per company

### Error: "Reviews can only be edited within 48 hours"
**Cause**: can_edit_until timestamp expired  
**Fix**: Edit sooner or create new review

### Error: "Cannot read properties of undefined (reading 'from')"
**Cause**: Supabase import wrong  
**Fix**: `const supabase = require('../config/database')` not `{ supabase }`

---

## 📈 WHAT HAPPENS IN THE DATABASE

### **When Review Created**:
1. Insert into company_reviews table
2. **Trigger**: set can_edit_until = NOW() + 48 hours
3. **Trigger**: generate anonymous_author_hash if is_anonymous
4. **Trigger**: update companies.updated_at
5. **My code**: recalculateCompanyRating()
   - Count all reviews
   - Calculate average overall_rating
   - Update companies.overall_rating and total_reviews

### **When Review Updated**:
1. Update company_reviews row
2. Set edited_at = NOW()
3. **Trigger**: update companies.updated_at
4. **My code**: recalculateCompanyRating() if rating changed

### **When Review Deleted**:
1. Set deleted_at = NOW()
2. **My code**: recalculateCompanyRating()
   - Review excluded from average (WHERE deleted_at IS NULL)
   - Company rating decreases/increases accordingly

---

## ✅ CONFIRMATION CHECKLIST

Before pushing to dev branch, I verified:

- [x] All 7 company endpoints working
- [x] All 7 review endpoints working
- [x] GET /companies returns list with pagination ✅
- [x] GET /companies?search=Tech filters correctly ✅
- [x] POST /companies creates company ✅
- [x] PATCH /companies/:id updates ✅
- [x] GET /companies/:id/analytics returns rating distribution ✅
- [x] POST /reviews checks employment before allowing ✅
- [x] PATCH /reviews/:id enforces 48hr window ✅
- [x] GET /reviews/my-reviews returns user's reviews ✅
- [x] GET /companies/:companyId/reviews supports sorting ✅
- [x] Anonymous reviews hide reviewer identity ✅
- [x] Company rating recalculates after review changes ✅
- [x] Soft delete works (deleted_at set correctly) ✅
- [x] No syntax errors in code ✅
- [x] All services use correct DB column names ✅

---

## 🎓 THINGS TO STUDY FURTHER

1. **Supabase RPC Functions**: Learn to write custom PostgreSQL functions for complex queries
2. **Database Indexing**: Understand when to add indexes for performance
3. **Caching**: Redis for frequently accessed company data
4. **Rate Limiting**: Prevent abuse (already set up in middleware)
5. **Input Validation**: Add express-validator rules in validators.js
6. **Unit Testing**: Write tests with Jest for all service functions
7. **API Documentation**: Use Swagger/OpenAPI for endpoint docs
8. **Performance**: N+1 query problem, batch loading with DataLoader

---

## 🎉 SUMMARY

I successfully implemented **ALL Days 0-4 tasks**:

**14 API Endpoints** across 2 modules ✅  
**17 Service Functions** with full business logic ✅  
**Database Integration** with soft deletes, triggers, views ✅  
**Advanced Features**: Analytics, sorting, 48hr edit window ✅  
**Security**: Employment verification, duplicate prevention ✅  
**Code Quality**: Clean separation of concerns (routes → controllers → services) ✅  

**Total Lines of Code**: ~1300 lines  
**Files Created**: 6 files  
**Days Completed**: Days 0, 1, 2, 3, 4 ✅  

**Next Steps**:  
- [ ] Push to dev branch
- [ ] Code review with team
- [ ] Days 6-7: Polish & edge cases
- [ ] Add input validation rules
- [ ] Write unit tests

---

**Great job, Aya! You crushed it! 🚀**

# Company Rating Management System - Backend API

Backend API server for the Company Rating Management System built with Node.js, Express, and Supabase.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the `backend` directory by copying `.env.example`:

```bash
cp .env.example .env
```

Then fill in your environment variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# JWT Configuration (REQUIRED)
JWT_SECRET=your-secure-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Email Configuration (Optional for now)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`

### 4. Generate JWT Secrets

```bash
# In Node.js console or use online generator
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:

```
✅ Supabase connected successfully
✅ Server running on port 5000
```

### 6. Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/api
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Supabase connection
│   │   ├── env.js            # Environment variables
│   │   └── email.js          # Email configuration
│   ├── controllers/          # Request handlers
│   ├── middlewares/
│   │   ├── authMiddleware.js # Authentication (STUB - needs implementation)
│   │   ├── roleMiddleware.js # Authorization (STUB - needs implementation)
│   │   ├── errorHandler.js   # Error handling
│   │   ├── rateLimiter.js    # Rate limiting
│   │   └── validateMiddleware.js # Input validation
│   ├── routes/               # API routes
│   │   └── index.js          # Route aggregator
│   ├── services/             # Business logic
│   ├── utils/
│   │   ├── jwt.js            # JWT utilities
│   │   └── validators.js     # Validation rules
│   ├── app.js                # Express app setup
│   └── server.js             # Server entry point
├── .env                      # Environment variables (create this)
├── .env.example              # Environment template
├── .gitignore
└── package.json
```

## 🔧 Next Steps for Tech Lead

### ✅ Completed (Day 0)
- [x] Project structure created
- [x] Dependencies installed
- [x] Configuration files (database, env, email)
- [x] JWT utilities
- [x] Middleware stubs (auth, role, error handling, rate limiting)
- [x] Server and app setup

### 🚧 Day 1 Morning - CRITICAL (Unblocks Team)
The middleware **STUBS** are ready! Your team can now:
- ✅ Import `requireAuth` from `middlewares/authMiddleware.js`
- ✅ Import `requireEmployee`, `requireCompanyAdmin`, `requireSystemAdmin` from `middlewares/roleMiddleware.js`
- ✅ Start building their routes and controllers

**YOUR NEXT TASKS (Day 1 Afternoon):**

1. **Replace Auth Middleware Stub** → See comments in `authMiddleware.js`
2. **Build Auth Service** → Create `services/authService.js`:
   - `registerUser({ email, password, role, fullName, companyName })`
   - `loginUser({ email, password })`
   - `refreshToken(token)`
3. **Build Auth Controller** → Create `controllers/authController.js`
4. **Build Auth Routes** → Create `routes/authRoutes.js`
5. **Test with Postman**

### 📋 Day 2 Morning
1. **Replace Role Middleware Stub** → Implement real role checking
2. **Build Refresh Token Endpoint**
3. **Build Email Verification**

### 📋 Day 3-4
1. **Email Service** → Create `services/emailService.js`
2. **Password Reset Flow**
3. **Rate Limiting** (already configured, just apply to routes)
4. **Input Validation** (validators ready in `utils/validators.js`)

## 🗄️ Database Setup

You need to create these tables in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL schema from the project briefing document
3. Tables needed:
   - users
   - companies
   - employees
   - employments
   - company_reviews
   - employee_feedback
   - reported_reviews
   - audit_logs
   - refresh_tokens

## 📚 API Response Format

All endpoints use this standard format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## 🔐 Authentication Flow

1. User registers → `POST /api/auth/register`
2. Email verification (to be implemented)
3. User logs in → `POST /api/auth/login` → Returns accessToken + refreshToken
4. Requests include header: `Authorization: Bearer <accessToken>`
5. Token expires → `POST /api/auth/refresh-token`

## 👥 Team Communication

**Message to your team:**

> "🎉 Backend infrastructure is ready! The middleware stubs are in place:
> 
> - Import `requireAuth` from `middlewares/authMiddleware.js`
> - Import `requireCompanyAdmin`, `requireEmployee` from `middlewares/roleMiddleware.js`
> 
> You can start building your modules now. The stubs will allow any request through for testing. I'll replace them with real authentication by Day 1 afternoon.
> 
> Server running on: http://localhost:5000"

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server (auto-reload)
npm run dev

# Start production server
npm start
```

## 📖 Additional Resources

- [Project Briefing Document](../PROJECT_BRIEFING.md)
- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [JWT Best Practices](https://jwt.io/introduction)

## 🐛 Troubleshooting

**Server won't start:**
- Check `.env` file exists and has all required variables
- Verify Supabase credentials are correct
- Check port 5000 is not already in use

**Database connection fails:**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Ensure tables are created in Supabase

**Email service warning:**
- Email configuration is optional for now
- Server will start even if email fails
- Configure later when implementing email features

---

**Built with ❤️ by the Tech Team**

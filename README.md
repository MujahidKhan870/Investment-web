<<<<<<< HEAD
# Aura Capital - Investment & Portfolio Platform (MERN Stack)

A production-ready, fully responsive, and highly secure MERN Stack web application for Portfolio Management and Investment Returns generation. Features a premium glassmorphic dark-theme UI, comprehensive ledger audits, role-based controls, dynamic SVG charts, and interactive administrator portals.

---

## Folder Structure Directory

```
investment-portfolio-platform/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js    # Administrative controls (users/plans/withdrawals)
│   │   ├── authController.js     # Signup/login/devices/locking mechanisms
│   │   ├── earningController.js  # Yield summaries
│   │   ├── investmentController.js # Subscriptions & analytic charts
│   │   ├── notificationController.js # User alerts
│   │   ├── reportController.js   # CSV export reports generators
│   │   └── walletController.js   # Deposits, withdrawal locks & balance checks
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT protection & RBAC route guards
│   │   ├── errorMiddleware.js    # Global API error boundary parser
│   │   └── rateLimiter.js        # Prevents brute force on auth actions
│   ├── models/
│   │   ├── User.js, Admin.js, Wallet.js, Transaction.js, Earning.js,
│   │   ├── Notification.js, Settings.js, ActivityLog.js, AuditLog.js,
│   │   ├── InvestmentPlan.js, UserSession.js, VerificationToken.js, 
│   │   └── PasswordResetToken.js
│   ├── routes/
│   │   └── [auth, user, wallet, investment, admin, report, notification]Routes.js
│   ├── scripts/
│   │   └── seed.js               # Standalone database seeder for admin & plans
│   ├── services/
│   │   ├── calculationEngine.js  # Daily yield payout mathematical engine
│   │   └── cronService.js        # Automates calculation triggers using node-cron
│   ├── utils/
│   │   └── logger.js             # Terminal logging utility
│   ├── .env                      # Secrets & parameters configuration
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Application entrypoint
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── AdminRoute.jsx    # Guard for administrative views
    │   │   ├── PrivateRoute.jsx  # Guard for user views
    │   │   ├── Navbar.jsx        # Notification bell popover panel
    │   │   └── Sidebar.jsx       # Left navigation links panel
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global session state & glassmorphic toast alerts
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx # Stats, approvals, plan configurators, audits
    │   │   ├── Dashboard.jsx     # Overview widgets, SVG area charts, payouts table
    │   │   ├── ForgotPassword.jsx # Recovery requests sandbox UI
    │   │   ├── Investments.jsx   # Tier catalog cards, purchase modals, histories
    │   │   ├── Login.jsx, Register.jsx, ResetPassword.jsx, VerifyEmail.jsx
    │   │   ├── Profile.jsx       # Personal configurations & active device revoke
    │   │   └── Wallet.jsx        # Simulated Stripe checkouts & withdrawal locks
    │   ├── services/
    │   │   └── api.js            # Axios client with automated refresh token loops
    │   ├── App.jsx               # Routes catalog mappings
    │   ├── index.css             # Vanilla CSS layout styling system
    │   └── main.jsx              # Client mounting point
    ├── index.html                # Google Font configurations
    ├── package.json              # React dependencies
    └── vite.config.js            # Vite compiler configuration
```

---

## Tech Stack Requirements

- **Node.js**: `v18.0.0` or higher
- **MongoDB**: `v5.0` or higher (run locally or on Mongo Atlas cloud)
- **Vite/React**: Bundled in `package.json`

---

## Local Sandbox Installation Guide

### Step 1: Configure Database and Environment variables
Copy the `.env.example` in `backend/` folder into a `.env` file:
```bash
cp backend/.env.example backend/.env
```
Update `MONGO_URI` to point to your MongoDB instance (defaults to local database: `mongodb://127.0.0.1:27017/investment_platform`).

### Step 2: Install Backend & Launch Dev Server
```bash
cd backend
npm install
# Seed plans and the default admin account: admin@investmentplatform.com / AdminSecurePassword123!
npm run seed
# Start backend API (runs on http://localhost:5000)
npm run dev
```
*Note: The backend automatically checks database schemas on startup. If plans or users are empty, the seeder fires automatically.*

### Step 3: Install Frontend & Launch Client compiler
```bash
cd ../frontend
npm install
# Start client bundler (runs on http://localhost:5173 with proxy configuration)
npm run dev
```

---

## API Endpoints Reference Catalog

### 1. Authentication (`/api/auth`)
- `POST /register`: Registers user account. Role is strictly forced to `'user'`.
- `POST /login`: Validates password. Triggers account lockout warnings after 5 failures. Saves cookie tokens.
- `POST /logout`: Invalidates session token in DB. Clears cookies.
- `POST /refresh-token`: Exposes new JWT access tokens using refresh token cookies.
- `POST /verify-email`: Activates accounts using hash tokens.
- `POST /forgot-password`: Mock generates recovery tokens (logged to console).
- `POST /reset-password`: Resets credentials using recovery tokens.
- `GET /sessions`: Lists device session states (device type, IP, browser).
- `DELETE /sessions/:sessionId`: Revokes specific device tokens forcing logout.

### 2. Wallet Ledger (`/api/wallet`)
- `GET /`: Returns balance and summaries.
- `POST /deposit`: Simulates instant wallet deposits via payment gateways.
- `POST /withdraw`: Deducts funds immediately and queues withdrawal for approval.
- `GET /transactions`: Returns cash flow ledger records.

### 3. Investment Portfolios (`/api/investments`)
- `GET /plans`: Returns active package tiers.
- `POST /subscribe`: Checks limits & user balance, debits wallet, creates active contract term.
- `GET /my-investments`: Lists active and expired investment contracts.
- `GET /analytics`: Provides aggregated capital stats and recent payout returns history.

### 4. Administrative Controls (`/api/admin`) *(Strictly guarded to `'admin'` role)*
- `GET /stats`: Overall platform statistics.
- `GET /users`: Directory of registered user accounts.
- `PATCH /users/:userId/status`: Suspends, blocks, or activates user access.
- `PATCH /users/:userId/promote`: Upgrades user account to admin.
- `GET /withdrawals`: Withdrawal request listings.
- `PATCH /withdrawals/:transactionId`: Approves (permanently debits) or Rejects (restores wallet balance) withdrawal requests.
- `POST /plans`: Creates new investment plan configuration.
- `PATCH /plans/:planId`: Updates daily rates, limits, or deactivates package tier.
- `POST /trigger-earnings`: Developer debug manual override: runs profit engine calculation immediately.
- `GET /audit-logs`: Audit logs listing.

### 5. CSV Reports (`/api/reports`)
- `GET /transactions`: User/Admin transaction CSV statement.
- `GET /earnings`: User/Admin returns statement.
- `GET /users` *(Admin only)*: Registered users list.
- `GET /investments` *(Admin only)*: active contracts list.
- `GET /audit-logs` *(Admin only)*: System audit trails.

---

## Earnings Calculation Profit Engine

The system contains an automated background scheduler that processes investments.
1. **Cron Automation**: Runs daily at midnight using `node-cron` schedules configured in settings.
2. **Double Payout protection**: The engine queries current calendar days `YYYY-MM-DD` and checks the `Earning` collections compound unique index (`investmentId` + `periodDate`) before paying. If a return already exists, the record skips, ensuring zero duplicate calculations.
3. **Immutability Ledger**: Every profit payout creates an immutable `Transaction` record, complete with a unique reference number and a computed SHA-256 ledger verification hash linking User ID, Wallet ID, and Amount parameters.
4. **Calculations**:
   $$\text{Payout Amount} = \text{Amount Invested} \times \left(\frac{\text{Daily Return Percentage}}{100}\right)$$
   Increments `Wallet.balance`, `Wallet.totalEarnings`, and logs dashboard alerts.
=======
# Investment-web
Professional MERN-based Investment Platform with responsive UI, user dashboard, investment plans, wallet management, analytics, and admin panel.
>>>>>>> 3d207061b55f5cd4647702ae635a5e340cd362bb

# 🧠 Master Quiz — MERN Full-Stack Quiz Application

A production-ready quiz web application built with **MongoDB, Express, React (Vite), and Node.js**.

## Features

- **100-question quiz** — 10 random questions from each of 10 sections per session
- **JWT authentication** — httpOnly cookie + Bearer token fallback
- **Forgot & Reset Password** — secure token generation with SHA-256 database hashing, rate limiting, and email dispatch
- **Google OAuth 2.0** — sign in with Google, automatic account linking
- **Role-based access** — `user` and `admin` roles with strict middleware protection
- **Live autosave** — answers saved to server as you select them
- **5-page quiz UI** — 20 questions per page, tracker sidebar, resume on refresh
- **Scoring** — +1 correct, −0.2 wrong, 0 unanswered; clamped to 0 minimum
- **Dashboard** — stats cards, score-over-time line chart, section accuracy bar chart
- **Admin panel** — add/edit/delete questions, bulk CSV/JSON upload, stats overview
- **Secure seed scripts** — 150 questions (15 per section) + admin account configured strictly via environment variables (no hardcoded passwords)

---

## Project Structure

```
QUIZ_APP/
├── server/          # Node.js + Express backend
│   ├── src/
│   │   ├── config/       constants.js, db.js, passport.js
│   │   ├── controllers/  authController.js, quizController.js, ...
│   │   ├── middleware/   auth.js, role.js, errorHandler.js, rateLimiter.js
│   │   ├── models/       User.js, Question.js, QuizSession.js
│   │   ├── routes/       auth.js, quiz.js, dashboard.js, admin.js
│   │   ├── utils/        scoring.js, questionSelector.js, mailer.js
│   │   └── index.js
│   ├── scripts/     seedAdmin.js, seedQuestions.js
│   ├── tests/       auth.test.js, scoring.test.js, questionSelector.test.js
│   └── .env.example
└── client/          # React + Vite + Tailwind CSS frontend
    ├── src/
    │   ├── api/          axios.js, auth.js, quiz.js, dashboard.js, admin.js
    │   ├── components/   Navbar, ProtectedRoute, AdminRoute, LoadingSpinner
    │   ├── context/      AuthContext.jsx
    │   └── pages/        Login, Register, ForgotPassword, ResetPassword, Dashboard, Quiz, Review, Admin/*
    └── vite.config.js    (proxies /api → localhost:5000)
```

---

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- **MongoDB** running locally on port 27017 (or a MongoDB Atlas URI)
- *(Optional)* Google OAuth 2.0 credentials for Google Sign-in
- *(Optional)* SMTP credentials for production email delivery (development uses Ethereal with zero config)

---

## Quick Start

### 1. Clone / open the project

```bash
cd QUIZ_APP
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set your values:

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/quiz_app` |
| `JWT_SECRET` | Secret for signing JWTs (must be long & random) | `your_secret_key` |
| `CLIENT_URL` | Frontend URL (for CORS & OAuth redirect) | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | *(optional)* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | *(optional)* |
| `SMTP_HOST` | SMTP Host (leave empty in dev for Ethereal) | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_USER` | SMTP Username | *(optional)* |
| `SMTP_PASS` | SMTP Password / App Password | *(optional)* |
| `SMTP_FROM` | Sender header | `"Master Quiz" <no-reply@...>` |
| `ADMIN_NAME` | First admin name (seed script) | `Your Admin Name` |
| `ADMIN_EMAIL` | First admin email (seed script) | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | First admin password (min 12 chars) | `ChooseAStrongPassword123!` |

> 🔒 **Security Notice:** The admin user is **never** hardcoded. You must provide `ADMIN_NAME`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` (minimum 12 characters) in `server/.env`. The seed script will reject execution if these are missing.

### 3. Install dependencies

```bash
# In server/
npm install

# In client/
cd ../client
npm install
```

### 4. Seed the database

```bash
cd ../server
npm run seed:admin       # creates the admin account from .env credentials
npm run seed:questions   # inserts 150 sample questions (15 per section)
# or run both at once:
npm run seed
```

### 5. Start the servers

Open **two terminals**:

```bash
# Terminal 1 — backend (port 5000)
cd server
npm run dev

# Terminal 2 — frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Google Authentication: Do You Need Firebase?

### Short Answer:
**No, you do NOT need Firebase.**
This application uses standard **OAuth 2.0 directly via Google Cloud Console and Passport.js (`passport-google-oauth20`)**. The authentication handshake happens between your server and Google's standard OAuth 2.0 endpoints without requiring the Firebase SDK.

However, if you **already have a Firebase project**, every Firebase project is automatically a Google Cloud project under the hood. You can obtain your OAuth keys from either console.

Below are the step-by-step instructions for both setups:

---

### Option A: Direct Google Cloud Console (Recommended & Standard)

1. **Go to Google Cloud Console**:
   - Navigate to [https://console.cloud.google.com/](https://console.cloud.google.com/) and sign in.
2. **Create or Select a Project**:
   - Click the project dropdown at the top left → **New Project**.
   - Give it a name (e.g. `Master-Quiz-App`) and click **Create**.
3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services** → **OAuth consent screen**.
   - Select User Type: **External** → click **Create**.
   - Enter App Name (`Master Quiz`), User support email, and Developer contact email.
   - Click **Save and Continue** through Scopes (default scopes `email`, `profile`, `openid` are already included).
   - In "Test users", add your own Google email address (if keeping the app in "Testing" mode). Click **Save and Continue**.
4. **Create OAuth Client ID**:
   - Go to **APIs & Services** → **Credentials**.
   - Click **+ Create Credentials** at the top → select **OAuth client ID**.
   - Application type: Select **Web application**.
   - Name: `Master Quiz Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (dev)
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback` (dev)
     - `https://your-production-domain.com/api/auth/google/callback` (prod)
   - Click **Create**.
5. **Copy Credentials to `.env`**:
   - Copy the generated **Client ID** and **Client Secret**.
   - Paste them into `server/.env`:
     ```env
     GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your_client_secret_here
     ```
6. **Restart your server**:
   - Stop and restart `npm run dev` in the `server/` directory.

---

### Option B: If You Already Have or Prefer Firebase Console

If you are using Firebase:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. In the left sidebar, navigate to **Build** → **Authentication**.
4. Under the **Sign-in method** tab, click **Google** and toggle **Enable**.
5. Select a project support email and click **Save**.
6. Under Google sign-in provider details, click the expand arrow:
   - Notice the **Web SDK configuration** showing a **Web client ID** and **Web client secret**.
7. In Firebase, go to **Project Settings** (gear icon) → click the link that says **Google Cloud Console** under your project name, OR directly visit [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials) for that linked project.
8. Under **OAuth 2.0 Client IDs**, click the Web client created by Firebase.
9. Add the **Authorized redirect URIs**:
   - `http://localhost:5000/api/auth/google/callback`
10. Copy the **Client ID** and **Client Secret** into `server/.env`:
    ```env
    GOOGLE_CLIENT_ID=your_firebase_web_client_id
    GOOGLE_CLIENT_SECRET=your_firebase_client_secret
    ```

**Account linking**: If a user signs in with Google using an email that already has a local password account, the Google ID is automatically linked to their existing account without creating duplicate users.

---

## Password Reset & Email Configuration

### Development Mode (Zero Config)
In development, if `SMTP_HOST` is left blank in `server/.env`:
- The app automatically creates a temporary **Ethereal Mail** session.
- When you click "Forgot Password" on http://localhost:5173/login, a secure 32-byte cryptographic token is generated.
- The hashed token is stored in MongoDB (SHA-256) with a 1-hour expiration.
- The backend console logs an **Ethereal preview link** (e.g. `https://ethereal.email/message/...`) where you can view the rendered HTML email and click the reset button.

### Production Mode (Real SMTP)
To send real emails in production, configure any standard SMTP provider in `server/.env`:

```env
# Example using Gmail (with Google App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your_16_digit_app_password
SMTP_FROM="Master Quiz" <no-reply@yourdomain.com>
```

*(You can also use SendGrid, Postmark, AWS SES, Mailgun, etc.)*

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register with name, email, password |
| POST | `/api/auth/login` | — | Login with email/password (returns JWT + cookie) |
| POST | `/api/auth/forgot-password` | — | Request password reset email (enumeration-safe) |
| POST | `/api/auth/reset-password/:token` | — | Reset password with token from email link |
| GET | `/api/auth/google` | — | Redirect to Google OAuth 2.0 |
| GET | `/api/auth/google/callback` | — | Google OAuth callback & JWT issuing |
| GET | `/api/auth/me` | ✓ | Get current user profile |
| POST | `/api/auth/logout` | ✓ | Clear session & httpOnly cookie |

### Quiz
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/quiz/start` | ✓ | Start new session (10 random questions per section × 10 sections = 100 questions) |
| GET | `/api/quiz/current` | ✓ | Retrieve in-progress session (options shuffled, correct answers omitted) |
| PUT | `/api/quiz/answer` | ✓ | Autosave selected answer |
| POST | `/api/quiz/submit` | ✓ | Server-side evaluation & final score calculation |
| GET | `/api/quiz/history` | ✓ | List completed quiz sessions for current user |
| GET | `/api/quiz/:id/review` | ✓ | Full attempt review with user choices and correct answers revealed |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | ✓ | Aggregated statistics, score history line chart, and section accuracy data |

### Admin (admin role required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | System overview stats & deficit section alerts |
| GET | `/api/admin/questions` | List questions with search, section filter, pagination |
| POST | `/api/admin/questions` | Create a new question with 4 options and correct answer index |
| PUT | `/api/admin/questions/:id` | Update question details |
| DELETE | `/api/admin/questions/:id` | Delete question |
| POST | `/api/admin/questions/bulk` | Bulk upload CSV or JSON with validation report |

---

## Scoring Rules

Scoring parameters are centralized in [`server/src/config/constants.js`](server/src/config/constants.js):

| Result | Marks |
|---|---|
| Correct | `+1.0` |
| Incorrect | `−0.2` (20% penalty) |
| Unanswered | `0.0` |
| Minimum score | `0.0` (clamped) |

`finalScore = Math.max(0, (correctCount × 1) − (incorrectCount × 0.2))`

---

## Running Tests

```bash
cd server
npm test
```

Automated Jest test suites cover:
- **Authentication & Security** — password hashing, verification, `toSafeObject` sanitizer (ensuring `passwordHash` and reset tokens never leak), cryptographic token hashing
- **Scoring logic** — all correct, all wrong, penalty clamping, shuffle index mapping
- **Question selection** — random sampling ($sample), uniqueness, 10 per section constraint

---

## Bulk Upload Format

### CSV

```csv
section,questionText,option1,option2,option3,option4,correctAnswer
1,"What is 2+2?","3","4","5","6",1
```

*(correctAnswer is 0-indexed: 0=option1, 1=option2, 2=option3, 3=option4)*

### JSON

```json
[
  {
    "section": 1,
    "questionText": "What is 2+2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": 1
  }
]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| API Server | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth & Security | JWT, bcryptjs, Passport.js (Google OAuth 2.0), crypto, express-rate-limit, helmet, cors |
| Email Service | Nodemailer (with Ethereal development fallback) |
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| HTTP Client | Axios |
| Validation | express-validator |
| Testing | Jest |

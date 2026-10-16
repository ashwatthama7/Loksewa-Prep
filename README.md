# 📚 Loksewa Prep — Full-Stack Quiz Application

A production-ready full-stack MERN quiz application designed for competitive exam preparation, featuring section-wise question sampling, real-time autosave, performance analytics, and an admin management portal.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — Component-based user interface
- **Vite 5** — Modern frontend build tool and dev server
- **Tailwind CSS 3** — Utility-first responsive styling
- **React Router v6** — Client-side SPA routing and protected route guards
- **Recharts 2** — Data visualization (score trends line chart, section accuracy bar chart)
- **Axios** — Promise-based HTTP client with request/response interceptors

### Backend & API
- **Node.js 18+** — Server-side JavaScript runtime
- **Express 4** — REST API framework
- **Passport.js (`passport-google-oauth20`)** — Google OAuth 2.0 social authentication
- **Nodemailer** — Email delivery service for password reset links
- **express-validator** — Request body and parameter validation
- **express-rate-limit & Helmet** — API rate limiting, brute-force protection, and secure HTTP headers

### Database
- **MongoDB Atlas** — Cloud NoSQL document database
- **Mongoose 8** — Object Data Modeling (ODM) with schema validation and indexing

### Security & Authentication
- **JSON Web Tokens (JWT)** — Stateless authentication (httpOnly cookies + Bearer token fallback)
- **bcryptjs** — Salted password hashing
- **Node.js Crypto** — Cryptographic tokens for secure password recovery

### Testing & Deployment
- **Jest** — Automated backend test suites
- **Render.com** — Cloud application hosting & automated Git deployments

---

## 🚀 Key Features

- **100-Question Exam Simulation** — 10 random questions sampled from each of 10 sections using MongoDB `$sample`.
- **Exam Integrity & Shuffling** — Shuffled question and option orders persisted per session; correct answers are never sent to the client until submission.
- **Real-Time Autosave** — Answers saved to the database as you click, with 5-page pagination (20 questions/page) and an answered/unanswered tracker palette.
- **Competitive Scoring Engine** — `+1.0` correct, `−0.2` incorrect penalty, `0.0` unanswered (clamped to a minimum of 0).
- **User Dashboard & Analytics** — Total attempts, average/best scores, accuracy rates, and visual charts.
- **Admin Management Portal** — Question CRUD, platform statistics, and bulk CSV/JSON question upload with automatic ID assignment (`Q-XXXX`).
- **Role-Based Access Control** — Protected user and administrator routes.

---

## ⚙️ Environment Variables

Configured in `server/.env` (locally) or in **Render's Environment** settings:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Strong secret key for signing JWTs |
| `CLIENT_URL` | Frontend URL (`https://loksewa-prep.onrender.com` or `http://localhost:5173`) |
| `ADMIN_NAME` | Initial administrator name (seed script) |
| `ADMIN_EMAIL` | Initial administrator email (seed script) |
| `ADMIN_PASSWORD` | Initial administrator password (min 12 chars) |
| `GOOGLE_CLIENT_ID` | *(Optional)* Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | *(Optional)* Google OAuth Client Secret |
| `SMTP_HOST` | *(Optional)* SMTP mail server host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | *(Optional)* SMTP port (default: `587`) |
| `SMTP_USER` | *(Optional)* SMTP email / username |
| `SMTP_PASS` | *(Optional)* SMTP app password |

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install --prefix server
npm install --prefix client

# 2. Seed database (from server directory)
cd server
npm run seed:admin
npm run seed:questions
cd ..

# 3. Start development servers
# Backend (port 5000):
npm run dev --prefix server

# Frontend (port 5173):
npm run dev --prefix client
```

---

## 🧪 Tests

```bash
cd server
npm test
```
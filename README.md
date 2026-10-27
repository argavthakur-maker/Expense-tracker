<div align="center">

# Hostelers

### *Spend Smarter. Save Better. Live Freely.*

**A full-stack expense manager built for hostel & college students — make your pocket money last the whole month.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&logo=open-source-initiative&logoColor=white)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5-000000.svg?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini-8E75B2.svg?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [Environment Configuration](#-environment-configuration) · [Project Structure](#-project-structure) · [Contributing](#-contributing)

</div>

<br>

## ✨ Overview

**Hostelers** is a full-stack expense-tracking web application designed around the realities of hostel life — tight monthly budgets, mess fees, trips with friends, and pocket money that never quite reaches day 30.

Log expenses in seconds, set monthly and category-wise budgets, analyse where every rupee goes, build savings goals, and chat with **Gix** — a built-in, Gemini-powered AI assistant that understands your financial snapshot and gives practical, judgment-free guidance.

<br>

## 🚀 Features

|  | Feature | Description |
|:---:|---|---|
| 📊 | **Dashboard** | Instant overview of monthly spend, remaining budget, safe daily limit and recent activity |
| 💸 | **Expense Tracking** | Fast expense entry with categories, dates, titles and notes |
| 🎯 | **Budgets** | Monthly budget plus per-category allocations with live progress and near/over-budget alerts |
| 📈 | **Analytics** | Interactive charts (Recharts) — category breakdowns, weekly trends and audit statistics |
| 🏆 | **Savings Goals** | Create goals with target amounts and dates, and track progress toward them |
| 🤖 | **Ask Gix (AI)** | In-app chat assistant , grounded in the user's real financial data |
| 👤 | **Authentication** | One-click Google Sign-In with server-side session cookies; the header profile reflects the signed-in identity |
| 🧑‍🤝‍🧑 | **Multi-account data** | Each signed-in account gets its own independent data slice — a fresh dashboard, no cross-account leakage |
| 🌗 | **Dark Mode** | Light / dark theme, persisted per account |
| ⚡ | **Polished UX** | Framer Motion animations, toast notifications, responsive layout down to mobile |

<br>

## 🏗️ Architecture

```
┌──────────────────────┐         ┌───────────────────────────────┐
│  React SPA (Vite)    │  /api   │  Express 5 server (server.js) │
│  React Router 7      │ ──────▶ │  • Google OAuth verification  │
│  Tailwind CSS UI     │  proxy  │  • HttpOnly session cookies   │
│  Per-account state   │         │  • Ask Gix → Gemini API       │
│  (localStorage)      │         │  • Static hosting of dist/    │
└──────────────────────┘         └───────────────────────────────┘
```

- **Google Sign-In** — Google Identity Services returns an ID token, which the backend verifies (`google-auth-library`), upserts the user, and issues an `HttpOnly` session cookie. `/api/auth/session` and `/api/auth/logout` round out the session lifecycle.
- **Per-account data model** — expenses, budgets, goals, preferences and notifications are stored client-side in namespaced slices (`hostelers_app_data:<email>`) so every account starts and stays separate. A secure server-side store is the natural next step.
- **Ask Gix** — the chat sends only a compact financial snapshot to the backend; the Gemini API key never reaches the browser.

<br>

## 🛠️ Tech Stack

**Frontend** — React 19 · TypeScript · Vite · Tailwind CSS · React Router 7 · Recharts · Framer Motion · lucide-react

**Backend** — Node.js · Express 5 · cookie-parser · CORS · morgan · google-auth-library

**Services** — Google Identity (OAuth 2.0 sign-in) · Google Gemini API (AI assistant)

**Tooling** — Oxlint · TypeScript · concurrently (runs API + Vite dev server together)

<br>

## ⚡ Quick Start

### Prerequisites

- Node.js 18 or newer
- A Google Cloud OAuth client ID (see [Environment Configuration](#-environment-configuration))
- A Gemini API key — optional; required only for Ask Gix ([get a free key](https://aistudio.google.com/apikey))

### Installation

```bash
# 1 — Clone the repository
git clone https://github.com/argavthakur-maker/Expense-tracker.git
cd Expense-tracker

# 2 — Install dependencies
npm install

# 3 — Configure environment
cp .env.example .env     # then fill in the values (see below)

# 4 — Run everything (frontend :5173 + backend :5000)
npm run dev
```

> 💡 Open **http://localhost:5173** in your browser — Vite proxies all `/api` requests to the Express backend on port 5000, so no CORS setup is needed in development.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Run the Express API (:5000) and Vite dev server (:5173) together |
| `npm run build` | Type-check and build the production bundle into `dist/` |
| `npm start` | Serve the built app + API on the configured `PORT` (default 5000) |
| `npm run server` | Run only the Express backend |
| `npm run preview` | Preview the production build with Vite |
| `npm run lint` | Lint the codebase with Oxlint |

> ℹ️ **Dev vs. production ports** — the Vite dev server (5173) picks up source changes instantly. The Express server (5000) serves the built `dist/` bundle, so run `npm run build` after frontend changes to see them there.

<br>

## 🔑 Environment Configuration

Copy `.env.example` to `.env` and provide the following values:

| Variable | Required | Description |
|---|:---:|---|
| `VITE_GOOGLE_CLIENT_ID` | **Yes** | Google OAuth **Web application** client ID. Also read by the backend. In Google Cloud Console → APIs & Services → Credentials, set *Authorized JavaScript origins* to `http://localhost:5173` |
| `GEMINI_API_KEY` | Ask Gix | Gemini API key for the AI assistant. Without it, everything else still works and Ask Gix reports itself unavailable |
| `PORT` | No | Backend port. Defaults to `5000` |
| `FRONTEND_URL` | No | Origin allowed by CORS. Defaults to `http://localhost:5174`; common localhost origins are allowed automatically |
| `VITE_API_URL` | No | Absolute backend URL for separate deployments. Leave empty in development to keep using the Vite `/api` proxy |

<br>

## 🖼️ Screens

| Route | What you'll find |
|---|---|
| `/` | Landing page with product intro and highlights |
| `/login`, `/signup` | Google Sign-In and email forms |
| `/app` | Dashboard — stat cards, charts, safe daily budget |
| `/app/expenses` | Expense list with add / edit / delete |
| `/app/budget` | Pocket money and category allocations |
| `/app/analytics` | Deep-dive visualizations |
| `/app/savings` | Savings goals tracker |
| `/app/settings` | Profile, theme, currency and preferences |

<!-- 👇 Optional: drop real screenshots in a /docs folder and uncomment
<p align="center">
  <img src="docs/dashboard.png" width="600" alt="Hostelers Dashboard" />
</p>
-->

<br>

## 📁 Project Structure

```
├── server.js                  # Express API — auth, sessions, Ask Gix (Gemini), static hosting
├── index.html                 # Vite entry point
├── .env.example               # Environment variable template
├── src/
│   ├── App.tsx                # Router, theme sync & session guard
│   ├── hooks/
│   │   └── useAppData.tsx     # Global app-data provider (per-account state)
│   ├── services/
│   │   └── api.ts             # Auth, data persistence & Ask Gix client
│   ├── data/
│   │   └── mockData.ts        # Clean initial data schema
│   ├── lib/                   # Formatting & finance helpers
│   ├── pages/
│   │   ├── Dashboard.tsx      # Overview dashboard
│   │   ├── Expenses.tsx       # Expense management
│   │   ├── Budget.tsx         # Pocket money & category budgets
│   │   ├── Analytics.tsx      # Charts & insights
│   │   ├── Savings.tsx        # Savings goals
│   │   ├── Settings.tsx       # Profile, theme & preferences
│   │   └── auth/              # Login / Signup / Forgot password
│   └── components/
│       ├── layout/            # App shell, header, sidebar, landing page
│       ├── dashboard/         # Stat cards & charts
│       ├── expenses/          # Expense form & list
│       ├── ai/                # Ask Gix chat UI
│       ├── auth/              # Google Sign-In integration
│       └── shared/            # Reusable UI primitives, modals & toasts
```

<br>

## 🗺️ Roadmap

- [ ] Server-side persistence of account data (expenses follow the user across devices)
- [ ] Email + password authentication backed by the API
- [ ] Export expenses to CSV
- [ ] Recurring expenses (mess fees, rent)

<br>

## 🤝 Contributing

Contributions are welcome!

1. **Fork** the repository
2. Create your branch → `git checkout -b feature/amazing-feature`
3. Commit your changes → `git commit -m "feat: add amazing feature"`
4. Push the branch → `git push origin feature/amazing-feature`
5. Open a **Pull Request**

Found a bug? [Open an issue](https://github.com/argavthakur-maker/Expense-tracker/issues).

<br>

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br>

---

<div align="center">

Made with ❤️ for hostel students, by hostelers.

**Hostelers** · Spend Smarter. Save Better. Live Freely.

</div>

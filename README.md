<div align="center">

# 🏠 Hostelers

### *Spend Smarter. Save Better. Live Freely.*

**The expense manager built for hostel & college students — make your pocket money last the whole month.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&logo=open-source-initiative&logoColor=white)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5-000000.svg?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini-8E75B2.svg?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

[Features](#-features) · [Screens](#-screens) · [Quick Start](#-quick-start) · [Project Structure](#-project-structure) · [Contributing](#-contributing) · [License](#-license)

</div>

<br>

## ✨ Overview

**Hostelers** is a full-stack expense-tracking web app designed specifically for the realities of hostel life — tight monthly budgets, mess fees, trips with friends, and pocket money that never quite stretches to day 30.

Log expenses in seconds, set monthly and category budgets, watch live analytics of where every rupee goes, build savings goals, and chat with **Gix** — a built-in Gemini-powered AI assistant that knows your financial snapshot and gives practical, judgment-free advice.

<br>

## 🚀 Features

|  | Feature | Description |
|:---:|---|---|
| 📊 | **Dashboard** | Instant overview of monthly spend, budget left, daily limit and recent activity |
| 💸 | **Expense Tracking** | Fast expense entry with categories, dates and titles |
| 🎯 | **Budgets** | Monthly budget plus per-category budgets with live progress |
| 📈 | **Analytics** | Interactive charts (Recharts) — category breakdowns, weekly trends and more |
| 🏆 | **Savings Goals** | Create goals with target amounts and dates, and track progress |
| 🤖 | **Ask Gix (AI)** | A chat assistant with your financial context for real, practical answers |
| 🔐 | **Google Sign-In** | Secure one-click authentication with verified Google accounts|
| 🌗 | **Dark Mode** | Light / dark theme with system-wide sync |
| ⚡ | **Smooth UX** | Framer Motion animations, toast notifications, responsive layout |

<br>

## 🖼️ Screens

| Page | What you'll find |
|---|---|
| **Landing** | Product intro with animated highlights |
| `/app` — Dashboard | Stat cards, charts, quick insights |
| `/app/expenses` | Full expense list with add/edit |
| `/app/budget` | Monthly + category budgets |
| `/app/analytics` | Deep-dive visualizations |
| `/app/savings` | Savings goals tracker |
| `/app/settings` | Profile, theme & preferences |

<!-- 👇 Optional: drop real screenshots in a /docs folder and uncomment
<p align="center">
  <img src="docs/dashboard.png" width="600" alt="Hostelers Dashboard" />
</p>
-->

<br>

## 🛠️ Tech Stack

**Frontend** — React 19 · TypeScript · Vite · Tailwind CSS · React Router 7 · Recharts · Framer Motion · lucide-react

**Backend** — Node.js · Express 5 · cookie-parser · CORS · morgan

**Services** — Google Identity (OAuth 2.0 sign-in) · Google Gemini API (AI assistant)

**Tooling** — Oxlint · concurrently (runs API + Vite dev server together)

<br>

## ⚡ Quick Start

```bash
# 1 — Clone the repo
git clone https://github.com/argavthakur-maker/Expense-tracker.git
cd Expense-tracker

# 2 — Install dependencies
npm install

# 3 — Run everything (backend :5000 + frontend :5173)
npm run dev
```

> 💡 Open **http://localhost:5173** in your browser — the Express API runs automatically alongside Vite.

### Other commands

| Command | What it does |
|---|---|
| `npm run build` | Type-check and build the production bundle (`dist/`) |
| `npm start` | Serve the built app + API on the configured `PORT` (default 5000) |
| `npm run server` | Run only the Express backend |
| `npm run preview` | Preview the production build with Vite |
| `npm run lint` | Lint the codebase with Oxlint |



## 📁 Project Structure

```
├── server.js                  # Express API — auth, sessions, Ask Gix (Gemini)
├── index.html                 # Vite entry point
├── src/
│   ├── App.tsx                # Router, theme sync & session guard
│   ├── hooks/
│   │   └── useAppData.tsx     # Global app state provider
│   ├── pages/
│   │   ├── Dashboard.tsx      # Overview dashboard
│   │   ├── Expenses.tsx       # Expense management
│   │   ├── Budget.tsx         # Budgets
│   │   ├── Analytics.tsx      # Charts & insights
│   │   ├── Savings.tsx        # Savings goals
│   │   ├── Settings.tsx       # Preferences & theme
│   │   └── auth/              # Login / Signup / Forgot password
│   └── components/
│       ├── layout/            # App layout, header, landing page
│       ├── dashboard/         # Stat cards & charts
│       ├── expenses/          # Expense form & list
│       ├── ai/                # Ask Gix chat UI
│       ├── auth/              # Google sign-in button
│       └── shared/            # Reusable UI primitives & toasts
```

<br>

## 🤝 Contributing

Contributions are welcome! 🎉

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

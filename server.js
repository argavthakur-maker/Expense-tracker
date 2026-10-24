import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

const app = express();
const port = process.env.PORT || 5000;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error('❌ GOOGLE_CLIENT_ID is missing in .env');
}

const allowedOrigins = new Set([
  frontendUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Google OAuth client
const googleClient = new OAuth2Client(googleClientId);

// Temporary in-memory user store
const usersByEmail = new Map();
const usersById = new Map();

// Verify Google's ID token
async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: googleClientId,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.sub || !payload.email) {
    const error = new Error('Invalid Google account token.');
    error.status = 401;
    throw error;
  }

  if (!payload.email_verified) {
    const error = new Error('Please use a verified Google email.');
    error.status = 401;
    throw error;
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name,
    image: payload.picture,
  };
}

// Create or update user
function upsertUser(profile) {
  const { googleId, email, name, image } = profile;

  let user = usersByEmail.get(email);

  if (!user) {
    user = {
      id: `user_${googleId}`,
      googleId,
      email,
      name: name || email.split('@')[0],
      image: image || null,
      provider: 'google',
      createdAt: new Date().toISOString(),
    };
  } else {
    user.name = name || user.name;
    user.image = image || user.image;
    user.googleId = googleId;
  }

  usersByEmail.set(email, user);
  usersById.set(user.id, user);

  return user;
}

// ===== Ask Gix — Gemini AI chat =====

// gemini-3.8-flash, gemini-3.7-flash and gemini-flash-latest hang indefinitely
// on generateContent (verified Oct 2026 — the request never returns and the
// server's timeout aborts, so every prompt fails as "Gix took too long").
// gemini-3.5-flash answers in ~2-5s (primary); gemini-3.1-flash-lite (~1-3s)
// is the fallback if 3.5 is down or its free-tier quota is exhausted.
// NOTE: gemini-2.5-* models return 404 "no longer available to new users".
const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];
// Each attempt aborts on its own so a hung model fails fast and the next
// fallback still gets a chance (worst case total ≈ 2 × 30s + retry gap).
const ATTEMPT_TIMEOUT_MS = 30000;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error('❌ GEMINI_API_KEY is missing in .env — Ask Gix will be unavailable.');
}

/** Rounds a number to one decimal, dropping the decimal when whole. */
function roundAmount(n) {
  return Math.round(n * 10) / 10;
}

/** Compact financial snapshot so Gix answers from real data, not guesses. */
function buildContextBlock(context) {
  if (!context || typeof context !== 'object') return '';

  const lines = [];

  if (context.profile) {
    lines.push(`User profile: name "${context.profile.name}", college "${context.profile.college}".`);
  }
  if (context.month) lines.push(`Current month: ${context.month}.`);
  if (typeof context.monthlyBudget === 'number') {
    lines.push(`Monthly budget: ₹${context.monthlyBudget}.`);
  }
  if (typeof context.spentThisMonth === 'number') {
    lines.push(`Spent so far this month: ₹${roundAmount(context.spentThisMonth)}.`);
  }
  if (typeof context.daysRemaining === 'number') {
    lines.push(`Days remaining in the month: ${context.daysRemaining}.`);
  }
  if (Array.isArray(context.categoryTotals) && context.categoryTotals.length > 0) {
    lines.push('Spending by category this month: ' +
      context.categoryTotals.map((c) => `${c.category} ₹${roundAmount(c.amount)}`).join(', ') + '.');
  }
  if (typeof context.weeklyTotal === 'number') {
    lines.push(`Spent in the last 7 days: ₹${roundAmount(context.weeklyTotal)}.`);
  }
  if (Array.isArray(context.categoryBudgets)) {
    const set = context.categoryBudgets.filter((c) => c.amount > 0);
    if (set.length > 0) {
      lines.push('Category budgets: ' +
        set.map((c) => `${c.category} ₹${roundAmount(c.amount)}`).join(', ') + '.');
    }
  }
  if (Array.isArray(context.recentExpenses) && context.recentExpenses.length > 0) {
    lines.push('Recent expenses:');
    for (const e of context.recentExpenses) {
      lines.push(`  - ${e.date}: "${e.title}" ₹${roundAmount(e.amount)} (${e.category})`);
    }
  }
  if (Array.isArray(context.goals) && context.goals.length > 0) {
    lines.push('Savings goals:');
    for (const g of context.goals) {
      lines.push(`  - "${g.name}": saved ₹${roundAmount(g.saved)} of ₹${roundAmount(g.target)}, target date ${g.targetDate}.`);
    }
  }

  return lines.join('\n');
}

const GIX_SYSTEM_INSTRUCTION = [
  'You are Gix, a friendly, empathetic and practical AI assistant inside Hostelers, a hostel student expense-tracking app.',
  '',
  'YOUR MOST IMPORTANT RULE:',
  'Understand the user’s actual message and respond to their intent. Do not automatically turn every conversation into a budgeting discussion.',
  '',
  'CONVERSATION RULES:',
  '- For greetings, casual conversation, personal updates, emotions, or everyday situations, respond naturally and conversationally.',
  '- If the user says they are sick, injured, tired, stressed, or feeling sad, respond with empathy and appropriate general support. Do not mention their budget, remaining balance, daily spending limit, expenses, or savings unless they explicitly ask about money.',
  '- If the user shares good news or bad news, acknowledge it naturally instead of automatically generating a financial report.',
  '- Do not force financial advice, expense tracking reminders, or app features into unrelated conversations.',
  '- Never include a financial summary unless it is directly relevant to the user’s question.',
  '',
  'FINANCIAL QUESTIONS:',
  '- Use the provided financial snapshot when answering questions about budgets, spending, expenses, savings, or financial planning.',
  '- Calculate a daily spending limit only when relevant to the question.',
  '- Do not repeat the entire financial snapshot in every response.',
  '- Never invent missing financial information or recorded expenses.',
  '- All currency is Indian Rupees (₹).',
  '- Give concise, practical, judgment-free advice suitable for Indian hostel students.',
  '',
  'HEALTH AND SAFETY:',
  '- Be kind and supportive when the user discusses their health.',
  '- Provide only general health information when appropriate; do not diagnose illnesses or prescribe medication.',
  '- Encourage professional medical care when appropriate.',
  '- Never suggest compromising on medical care because of financial concerns.',
  '',
  'RESPONSE STYLE:',
  '- Keep responses natural, relevant, and concise, usually under 120 words.',
  '- Answer the user’s actual question first.',
  '- Avoid repetitive introductions, unnecessary bullet lists, and irrelevant suggestions.',
  '- Do not mention financial data simply because it is available in the context.'
].join('\n');


app.post('/api/ai/chat', async (req, res) => {
  if (!geminiApiKey) {
    return res.status(503).json({
      ok: false,
      error: 'Gix is unavailable: GEMINI_API_KEY is not configured on the server.',
    });
  }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const history = messages
    .filter((m) => m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'assistant') && !m.failed)
    .slice(-12)
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text.slice(0, 4000) }] }));

  if (history.length === 0) {
    return res.status(400).json({ ok: false, error: 'No message to answer.' });
  }

  const contextBlock = buildContextBlock(req.body?.context);
  // Attach the snapshot to the user's LATEST message (the question actually being
  // answered). Attaching it to the first historical message makes longer chats
  // drift toward stale earlier topics.
  let lastUserIdx = -1;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === 'user') {
      lastUserIdx = i;
      break;
    }
  }
  const contents = history.map((m, i) => (i === lastUserIdx && contextBlock
    ? { role: m.role, parts: [{ text: `My financial snapshot:\n${contextBlock}\n\n---\n\nQuestion: ${m.parts[0].text}` }] }
    : m));

  // Gemini's thinking tokens (Gemini 3.x) count against the output budget, so
  // keep the cap generous — the system prompt keeps answers short anyway.
  const MAX_OUTPUT_TOKENS = 4096;
  const payload = {
    contents,
    systemInstruction: { parts: [{ text: GIX_SYSTEM_INSTRUCTION }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  };

  // Retry policy: one retry per model for transient Gemini-side errors (503
  // high demand / 429 rate limit), then move on to the next fallback model.
  const TRANSIENT_STATUS = new Set([429, 503]);

  try {
    let data = null;
    let lastStatus = 0;
    let lastDetail = '';
    let timedOut = false;

    outer: for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

        let geminiResp;
        try {
          geminiResp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
        } catch (fetchErr) {
          clearTimeout(timeout);
          if (fetchErr.name === 'AbortError') {
            // This model hung instead of answering — don't retry it, let the
            // next fallback model take a turn.
            timedOut = true;
            lastStatus = 0;
            break;
          }
          throw fetchErr;
        }
        clearTimeout(timeout);

        if (geminiResp.ok) {
          data = await geminiResp.json();
          break outer;
        }

        lastStatus = geminiResp.status;
        timedOut = false;
        try {
          const errBody = await geminiResp.json();
          lastDetail = errBody?.error?.message || '';
        } catch { /* ignore parse failure */ }

        console.error(`Gemini API error (${model}, attempt ${attempt}):`, lastStatus, lastDetail);

        if (!TRANSIENT_STATUS.has(lastStatus)) break outer;
        if (attempt === 1) await new Promise((r) => setTimeout(r, 2000)); // small backoff before retry
      }
    }

    if (!data) {
      if (timedOut) {
        return res.status(504).json({
          ok: false,
          error: 'Gix took too long to answer. Please try again in a moment.',
        });
      }

      console.error('Gemini API error:', lastStatus, lastDetail);

      if (lastStatus === 429) {
        return res.status(429).json({
          ok: false,
          error: 'Gix has hit its free daily request limit — please try again later.',
        });
      }

      return res.status(lastStatus || 502).json({
        ok: false,
        error: 'Gemini API request failed.',
        status: lastStatus,
        detail: lastDetail,
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim();

    if (!reply) {
      return res.status(502).json({ ok: false, error: 'Gix could not generate a reply. Please rephrase and try again.' });
    }

    return res.json({ ok: true, reply });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gix took too long to answer. Please try again.' });
    }
    console.error('Ask Gix failed:', err.message);
    return res.status(502).json({
      ok: false,
      error: 'Gix could not respond right now. Please try again later.',
      detail: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Hostelers backend is running.',
  });
});

// Google client configuration
app.get('/api/auth/google', (req, res) => {
  res.json({
    googleClientId,
    frontendUrl,
  });
});

// Google sign-in
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        ok: false,
        error: 'Missing Google token.',
      });
    }

    const profile = await verifyGoogleToken(token);
    const user = upsertUser(profile);

    res.cookie('hostelers-session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err.message);

    return res.status(err.status || 500).json({
      ok: false,
      error: err.message || 'Google authentication failed.',
    });
  }
});
app.get('/api/auth/session', (req, res) => {
  const sessionId = req.cookies['hostelers-session'];

  if (!sessionId) {
    return res.json({
      ok: true,
      user: null,
    });
  }

  const user = usersById.get(sessionId) || null;

  if (!user) {
    res.clearCookie('hostelers-session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.json({
      ok: true,
      user: null,
    });
  }

  return res.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      provider: user.provider,
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('hostelers-session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.json({ ok: true });
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(port, () => {
  console.log(`🚀 Hostelers backend running at http://localhost:${port}`);
  console.log(`Frontend origin: ${frontendUrl}`);
  console.log(`Google Client ID configured: ${Boolean(googleClientId)}`);
  console.log('Server listening:', server.listening);
  console.log('Server address:', server.address());
});

server.on('close', () => {
  console.log('Server closed unexpectedly');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

export default app;




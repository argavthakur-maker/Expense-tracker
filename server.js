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

// Frontend configuration
const frontendUrl = (
  process.env.FRONTEND_URL || 'http://localhost:5174'
).trim().replace(/\/+$/, '');

// Google OAuth configuration
const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error('GOOGLE_CLIENT_ID is missing in .env');
}

// Allowed frontend origins
const allowedOrigins = new Set([
  frontendUrl,
  'https://expense-tracker-kappa-snowy.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]);

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured frontend origins.
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // Allow local development servers on any port.
    if (
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }

    console.error('Blocked CORS origin:', origin);

    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],
}));

// General middleware
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
      id: `user_${googleId} `,
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

// ============================================
// ASK GIX — GEMINI AI CHAT
// ============================================

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

const ATTEMPT_TIMEOUT_MS = 30000;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error(
    'GEMINI_API_KEY is missing in .env — Ask Gix will be unavailable.'
  );
}

/**
 * Round a number to one decimal place.
 */
function roundAmount(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Build a financial snapshot for Gix.
 */
function buildContextBlock(context) {
  if (!context || typeof context !== 'object') {
    return '';
  }

  const lines = [];

  if (context.profile) {
    lines.push(
      `User profile: name "${context.profile.name}", college "${context.profile.college}".`
    );
  }

  if (context.month) {
    lines.push(`Current month: ${context.month}.`);
  }

  if (typeof context.monthlyBudget === 'number') {
    lines.push(`Monthly budget: ₹${context.monthlyBudget}.`);
  }

  if (typeof context.spentThisMonth === 'number') {
    lines.push(
      `Spent so far this month: ₹${roundAmount(context.spentThisMonth)}.`
    );
  }

  if (typeof context.daysRemaining === 'number') {
    lines.push(`Days remaining in the month: ${context.daysRemaining}.`);
  }

  if (
    Array.isArray(context.categoryTotals) &&
    context.categoryTotals.length > 0
  ) {
    lines.push(
      'Spending by category this month: ' +
      context.categoryTotals
        .map(
          (c) => `${c.category} ₹${roundAmount(c.amount)} `
        )
        .join(', ') +
      '.'
    );
  }

  if (typeof context.weeklyTotal === 'number') {
    lines.push(
      `Spent in the last 7 days: ₹${roundAmount(context.weeklyTotal)}.`
    );
  }

  if (Array.isArray(context.categoryBudgets)) {
    const budgets = context.categoryBudgets.filter(
      (c) => c.amount > 0
    );

    if (budgets.length > 0) {
      lines.push(
        'Category budgets: ' +
        budgets
          .map(
            (c) => `${c.category} ₹${roundAmount(c.amount)} `
          )
          .join(', ') +
        '.'
      );
    }
  }

  if (
    Array.isArray(context.recentExpenses) &&
    context.recentExpenses.length > 0
  ) {
    lines.push('Recent expenses:');

    for (const expense of context.recentExpenses) {
      lines.push(
        `  - ${expense.date}: "${expense.title}" ₹${roundAmount(expense.amount)} (${expense.category})`
      );
    }
  }

  if (Array.isArray(context.goals) && context.goals.length > 0) {
    lines.push('Savings goals:');

    for (const goal of context.goals) {
      lines.push(
        `  - "${goal.name}": saved ₹${roundAmount(goal.saved)} of ₹${roundAmount(goal.target)}, target date ${goal.targetDate}.`
      );
    }
  }

  return lines.join('\n');
}

// Gix system instructions
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
  '- Do not mention financial data simply because it is available in the context.',
].join('\n');

// Ask Gix endpoint
app.post('/api/ai/chat', async (req, res) => {
  if (!geminiApiKey) {
    return res.status(503).json({
      ok: false,
      error: 'Gix is unavailable: GEMINI_API_KEY is not configured on the server.',
    });
  }

  const messages = Array.isArray(req.body?.messages)
    ? req.body.messages
    : [];

  const history = messages
    .filter(
      (message) =>
        message &&
        typeof message.text === 'string' &&
        (message.role === 'user' || message.role === 'assistant') &&
        !message.failed
    )
    .slice(-12)
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.text.slice(0, 4000) }],
    }));

  if (history.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'No message to answer.',
    });
  }

  const contextBlock = buildContextBlock(req.body?.context);

  // Attach the financial snapshot to the latest user message.
  let lastUserIdx = -1;

  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === 'user') {
      lastUserIdx = i;
      break;
    }
  }

  const contents = history.map((message, index) => {
    if (index === lastUserIdx && contextBlock) {
      return {
        role: message.role,
        parts: [
          {
            text:
              `My financial snapshot: \n${contextBlock} \n\n-- -\n\nQuestion: ${message.parts[0].text} `,
          },
        ],
      };
    }

    return message;
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: GIX_SYSTEM_INSTRUCTION }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };

  const TRANSIENT_STATUS = new Set([429, 503]);

  try {
    let data = null;
    let lastStatus = 0;
    let lastDetail = '';
    let timedOut = false;

    outer: for (const model of GEMINI_MODELS) {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const controller = new AbortController();

        const timeout = setTimeout(
          () => controller.abort(),
          ATTEMPT_TIMEOUT_MS
        );

        let geminiResp;

        try {
          geminiResp = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
        } catch (fetchErr) {
          clearTimeout(timeout);

          if (fetchErr.name === 'AbortError') {
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
          const errorBody = await geminiResp.json();
          lastDetail = errorBody?.error?.message || '';
        } catch {
          // Ignore response parsing errors.
        }

        console.error(
          `Gemini API error (${model}, attempt ${attempt}):`,
          lastStatus,
          lastDetail
        );

        if (!TRANSIENT_STATUS.has(lastStatus)) {
          break outer;
        }

        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
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
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!reply) {
      return res.status(502).json({
        ok: false,
        error: 'Gix could not generate a reply. Please rephrase and try again.',
      });
    }

    return res.json({
      ok: true,
      reply,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({
        ok: false,
        error: 'Gix took too long to answer. Please try again.',
      });
    }

    console.error('Ask Gix failed:', err.message);

    return res.status(502).json({
      ok: false,
      error: 'Gix could not respond right now. Please try again later.',
      detail:
        process.env.NODE_ENV === 'production'
          ? undefined
          : err.message,
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Hostelers backend is running.',
  });
});

// ============================================
// GOOGLE AUTH CONFIGURATION
// ============================================

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

// Check current session
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

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('hostelers-session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.json({
    ok: true,
  });
});

// ============================================
// SERVE FRONTEND BUILD IF AVAILABLE
// ============================================

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Handle unknown API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'API endpoint not found.',
  });
});

// CORS and other error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      ok: false,
      error: 'Origin is not allowed by CORS.',
    });
  }

  console.error('Server error:', err);

  return res.status(500).json({
    ok: false,
    error: 'Internal server error.',
  });
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(port, () => {
  console.log(`Hostelers backend running on port ${port}`);
  console.log(`Frontend origin: ${frontendUrl}`);
  console.log(`Google Client ID configured: ${Boolean(googleClientId)}`);
  console.log('Server listening:', server.listening);
  console.log('Server address:', server.address());
});

server.on('close', () => {
  console.log('Server closed.');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

export default app;


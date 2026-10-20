import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { OAuth2Client } from 'google-auth-library';

const app = express();
const port = process.env.PORT || 5000;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error('❌ GOOGLE_CLIENT_ID is missing in .env');
}

// Middleware
app.use(cors({
  origin: frontendUrl,
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
  }

  return res.json({
    ok: true,
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          provider: user.provider,
        }
      : null,
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

  return res.json({ ok: true });
});

// Start backend
app.listen(port, () => {
  console.log(`🚀 Hostelers backend running at http://localhost:${port}`);
  console.log(`Frontend origin: ${frontendUrl}`);
  console.log(`Google Client ID configured: ${Boolean(googleClientId)}`);
});

export default app;
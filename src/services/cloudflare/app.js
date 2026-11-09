import express from 'express';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';

export function createApp(env) {
    const app = express();

    const frontendUrl = (
        env.FRONTEND_URL || 'http://localhost:5174'
    ).trim().replace(/\/+$/, '');

    const googleClientId =
        env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID;

    const sessionSecret = env.SESSION_SECRET;

    const allowedOrigins = new Set([
        frontendUrl,
        'https://expense-tracker-kappa-snowy.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ]);

    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.has(origin)) {
                return callback(null, true);
            }

            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    app.use(express.json({ limit: '1mb' }));

    const googleClient = new OAuth2Client(googleClientId);

    const COOKIE_NAME = 'hostelers-session';
    const SESSION_DURATION = 24 * 60 * 60 * 1000;

    // Encode and decode session data
    function encode(data) {
        return Buffer.from(data).toString('base64url');
    }

    // Create signed session token
    async function createSession(user) {
        const payload = encode(JSON.stringify({
            user,
            expiresAt: Date.now() + SESSION_DURATION,
        }));

        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(sessionSecret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            new TextEncoder().encode(payload)
        );

        return `${payload}.${Buffer.from(signature).toString('base64url')}`;
    }

    // Verify signed session token
    async function verifySession(token) {
        try {
            if (!token || !sessionSecret) return null;

            const [payload, signature] = token.split('.');

            if (!payload || !signature) return null;

            const key = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(sessionSecret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['verify']
            );

            const valid = await crypto.subtle.verify(
                'HMAC',
                key,
                Buffer.from(signature, 'base64url'),
                new TextEncoder().encode(payload)
            );

            if (!valid) return null;

            const session = JSON.parse(
                Buffer.from(payload, 'base64url').toString()
            );

            if (session.expiresAt < Date.now()) return null;

            return session.user;
        } catch {
            return null;
        }
    }

    // Read session cookie
    function getSessionCookie(req) {
        const cookies = req.headers.cookie || '';

        const cookie = cookies
            .split(';')
            .map(item => item.trim())
            .find(item => item.startsWith(`${COOKIE_NAME}=`));

        return cookie
            ? decodeURIComponent(cookie.substring(COOKIE_NAME.length + 1))
            : null;
    }

    // Set session cookie
    function setSessionCookie(res, token) {
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: SESSION_DURATION,
            path: '/',
        });
    }

    // Clear session cookie
    function clearSessionCookie(res) {
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
        });
    }

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({
            ok: true,
            message: 'Backend is healthy!',
        });
    });

    // Configuration check
    app.get('/api/config-check', (req, res) => {
        res.json({
            googleClientIdConfigured: !!googleClientId,
            geminiApiKeyConfigured: !!env.GEMINI_API_KEY,
            sessionSecretConfigured: !!sessionSecret,
            frontendUrlConfigured: !!frontendUrl,
        });
    });

    // Google authentication configuration
    app.get('/api/auth/google', (req, res) => {
        res.json({
            googleClientId,
            frontendUrl,
        });
    });

    // GOOGLE LOGIN
    app.post('/api/auth/google', async (req, res) => {
        try {
            if (!googleClientId || !sessionSecret) {
                return res.status(500).json({
                    error: 'Google authentication is not configured.',
                });
            }

            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    error: 'Google token is required.',
                });
            }

            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: googleClientId,
            });

            const payload = ticket.getPayload();

            if (
                !payload ||
                !payload.sub ||
                !payload.email ||
                payload.email_verified !== true
            ) {
                return res.status(401).json({
                    error: 'Invalid Google account.',
                });
            }

            const user = {
                id: `user_${payload.sub}`,
                googleId: payload.sub,
                name: payload.name || '',
                email: payload.email,
                picture: payload.picture || '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
            };

            const sessionToken = await createSession(user);

            setSessionCookie(res, sessionToken);

            return res.json({
                success: true,
                user,
            });

        } catch (error) {
            console.error('Google authentication error:', error);

            return res.status(401).json({
                error: 'Google authentication failed.',
            });
        }
    });

    // CHECK LOGIN SESSION
    app.get('/api/auth/session', async (req, res) => {
        try {
            const token = getSessionCookie(req);
            const user = await verifySession(token);

            if (!user) {
                clearSessionCookie(res);

                return res.json({
                    success: true,
                    user: null,
                });
            }

            return res.json({
                success: true,
                user,
            });

        } catch (error) {
            console.error('Session error:', error);

            return res.status(500).json({
                error: 'Unable to verify session.',
            });
        }
    });

    // LOGOUT
    app.post('/api/auth/logout', (req, res) => {
        clearSessionCookie(res);

        return res.json({
            success: true,
            message: 'Logged out successfully.',
        });
    });

    // Unknown API route
    app.use('/api', (req, res) => {
        res.status(404).json({
            error: 'API route not found.',
        });
    });

    // Error handler
    app.use((err, req, res, next) => {
        console.error('Server error:', err);

        res.status(500).json({
            error: 'Internal server error.',
        });
    });

    return app;
}
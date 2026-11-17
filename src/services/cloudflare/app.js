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
        'https://expense-tracker-4dr.pages.dev',
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
                ok: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.picture,
                    provider: 'google',
                },
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
                    image: user.picture,
                    provider: 'google',
                },
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
            ok: true,
            message: 'Logged out successfully.',
        });
    });


    // Ask Gix — Gemini-powered chat endpoint used by the React frontend.
    app.post('/api/ai/chat', async (req, res) => {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({
                ok: false,
                error: 'Gix is unavailable: GEMINI_API_KEY is not configured on the Worker.',
            });
        }

        const messages = Array.isArray(req.body?.messages)
            ? req.body.messages
                .filter(message =>
                    message &&
                    typeof message.text === 'string' &&
                    (message.role === 'user' || message.role === 'assistant')
                )
                .slice(-12)
            : [];

        if (!messages.some(message => message.role === 'user')) {
            return res.status(400).json({ ok: false, error: 'No message to answer.' });
        }

        const context = req.body?.context && typeof req.body.context === 'object'
            ? JSON.stringify(req.body.context)
            : '';

        const contents = messages.map((message, index) => {
            const isLastUser = message.role === 'user' &&
                !messages.slice(index + 1).some(item => item.role === 'user');
            return {
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [{
                    text: isLastUser && context
                        ? `Financial context (use only when relevant): ${context}\n\nQuestion: ${message.text.slice(0, 4000)}`
                        : message.text.slice(0, 4000),
                }],
            };
        });

        const payload = {
            contents,
            systemInstruction: {
                parts: [{
                    text: 'You are Gix, a friendly and practical AI assistant inside Hostelers, an expense tracker for Indian college and hostel students. Answer the user’s actual question first. Use the supplied financial context only when relevant. Never invent financial facts. Currency is Indian Rupees (₹). Keep answers concise, empathetic, and useful.',
                }],
            },
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        };

        const models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
        let lastStatus = 502;
        let lastDetail = '';

        try {
            for (const model of models) {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const reply = data?.candidates?.[0]?.content?.parts
                        ?.map(part => part.text || '')
                        .join('')
                        .trim();

                    if (reply) return res.json({ ok: true, reply });
                    return res.status(502).json({
                        ok: false,
                        error: 'Gix could not generate a reply. Please try again.',
                    });
                }

                lastStatus = response.status;
                try {
                    const errorData = await response.json();
                    lastDetail = errorData?.error?.message || '';
                } catch {
                    lastDetail = '';
                }

                if (lastStatus !== 429 && lastStatus !== 503) break;
            }

            console.error('Gix Gemini request failed:', lastStatus, lastDetail);
            return res.status(lastStatus === 429 ? 429 : 502).json({
                ok: false,
                error: lastStatus === 429
                    ? 'Gix has reached the API request limit. Please try again later.'
                    : 'Gix could not respond right now. Please try again later.',
            });
        } catch (error) {
            console.error('Gix request failed:', error);
            return res.status(502).json({
                ok: false,
                error: 'Could not reach Gix right now. Please try again later.',
            });
        }
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
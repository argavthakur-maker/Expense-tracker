import express from 'express';
import { httpServerHandler } from 'cloudflare:node';
import { env } from 'cloudflare:workers';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hostelers Express API is running on Cloudflare!'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend is healthy!'
  });
});

app.get('/api/config-check', (req, res) => {
  res.json({
    googleClientIdConfigured: Boolean(env.GOOGLE_CLIENT_ID),
    geminiApiKeyConfigured: Boolean(env.GEMINI_API_KEY),
    sessionSecretConfigured: Boolean(env.SESSION_SECRET),
    frontendUrlConfigured: Boolean(env.FRONTEND_URL)
  });
});

app.listen(3000);

export default httpServerHandler({
  port: 3000
});

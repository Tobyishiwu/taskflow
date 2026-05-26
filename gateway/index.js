const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4000;
const DJANGO_API = process.env.DJANGO_API || 'http://127.0.0.1:8000';
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://taskflow-eight-weld.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('combined'));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Please try again later.' },
});

app.use(globalLimiter);

function decodeToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded) {
        req.headers['x-user-id'] = String(decoded.user_id || '');
        req.headers['x-user-name'] = String(decoded.username || '');
      }
    } catch (_) {}
  }
  next();
}

function requestLogger(req, res, next) {
  const userId = req.headers['x-user-id'] || 'anonymous';
  console.log(`[Gateway] ${req.method} ${req.path} | user=${userId} | ip=${req.ip}`);
  next();
}

app.use(decodeToken);
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gateway: 'Express.js',
    upstream: DJANGO_API,
    timestamp: new Date().toISOString(),
  });
});

const proxyOptions = {
  target: DJANGO_API,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error('[Gateway] Proxy error:', err.message);
      res.status(502).json({ error: 'Upstream service unavailable.' });
    },
  },
};

app.use('/api/auth', authLimiter, createProxyMiddleware(proxyOptions));
app.use('/api', createProxyMiddleware(proxyOptions));

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found on gateway.` });
});

app.listen(PORT, () => {
  console.log(`\n🚀 TaskFlow Gateway running on http://localhost:${PORT}`);
  console.log(`   Proxying → ${DJANGO_API}`);
  console.log(`   Rate limiting: 200 req/15min (global), 20/15min (auth)\n`);
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const trackerRoutes = require('./routes/trackerRoutes');
const insightRoutes = require('./routes/insightRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      // 1. Allow mobile apps, curl, or server-to-server testing (no origin)
      if (!origin) return callback(null, true);

      // 2. Allow local development
      if (origin === 'http://localhost:5174' || origin === 'http://localhost:5173') {
        return callback(null, true);
      }

      // 3. Match any Vercel URL belonging to your project domain
      // This checks if the origin starts with 'https://pcod-care' and ends with '.vercel.app'
      const isVercelDomain = origin.startsWith('https://pcod-care') && origin.endsWith('.vercel.app');

      if (isVercelDomain) {
        return callback(null, true);
      }
      
      // If it doesn't match anything above, block it
      return callback(new Error('Blocked by CORS security policy'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PCODCare API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trackers', trackerRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

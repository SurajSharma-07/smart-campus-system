const express = require('express');
const cors = require('cors');
const config = require('./config');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const metaRoutes = require('./routes/meta');
const complaintRoutes = require('./routes/complaints');
const notificationRoutes = require('./routes/notifications');

const app = express();

const allowedOrigins = (config.frontendOrigin || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (/^https:\/\/.*\.vercel\.app$/.test(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', app: 'Smart Campus Complaint Management System' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Server error. Check the backend terminal for details.' });
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connection established.');
    app.listen(config.port, () => {
      console.log(`Smart Campus API running at http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Could not connect to MySQL. Check backend/src/config.js and ensure MySQL is running.');
    console.error(error.message);
    process.exit(1);
  }
}

start();

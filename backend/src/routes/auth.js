const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
    if (!users.length) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const expected = hashPassword(password, user.password_salt);
    if (expected !== user.password_hash || !user.is_active) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = crypto.randomUUID();
    await pool.query(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 12 HOUR))',
      [token, user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.department_id
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.user_id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      departmentId: req.user.department_id,
      departmentName: req.user.department_name
    }
  });
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token = ?', [req.sessionToken]);
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

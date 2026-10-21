const express = require('express');
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.description, c.default_priority,
              d.id AS department_id, d.name AS department_name
       FROM categories c
       JOIN departments d ON d.id = c.department_id
       WHERE c.is_active = 1
       ORDER BY c.name`
    );
    res.json({ categories: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/departments', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, description FROM departments WHERE is_active = 1 ORDER BY name');
    res.json({ departments: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT key_name, key_value FROM settings');
    const settings = { institution_name: 'Smart Campus Institute', institution_logo: '' };
    rows.forEach(r => { settings[r.key_name] = r.key_value; });
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

router.post('/settings', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { institutionName, institutionLogo } = req.body || {};
    if (institutionName !== undefined) {
      await pool.query(
        'INSERT INTO settings (key_name, key_value) VALUES (\'institution_name\', ?) ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)',
        [institutionName.trim()]
      );
    }
    if (institutionLogo !== undefined) {
      await pool.query(
        'INSERT INTO settings (key_name, key_value) VALUES (\'institution_logo\', ?) ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)',
        [institutionLogo]
      );
    }
    res.json({ message: 'Institution settings updated successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


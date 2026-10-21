const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.id, n.complaint_id, n.title, n.message, n.is_read, n.created_at,
              c.ticket_code
       FROM notifications n
       LEFT JOIN complaints c ON c.id = n.complaint_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.user_id]
    );
    res.json({ notifications: rows });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const pool = require('../db');

async function authenticate(req, res, next) {
  try {
    let token = '';
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      token = header.slice(7).trim();
    } else if (req.query && req.query.token) {
      token = String(req.query.token).trim();
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const [rows] = await pool.query(
      `SELECT s.token, s.user_id, u.name, u.email, u.role, u.department_id,
              d.name AS department_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Session expired or invalid.' });
    }

    req.user = rows[0];
    req.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not authorized for this action.' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };

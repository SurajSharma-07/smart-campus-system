const express = require('express');
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const validStatuses = ['Submitted', 'In Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const validPriorities = ['Low', 'Medium', 'High', 'Critical'];

function priorityDays(priority) {
  return { Low: 7, Medium: 5, High: 3, Critical: 1 }[priority] || 5;
}

function buildTicketCode(id) {
  return `CMP-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
}

async function addNotification(connection, userId, complaintId, title, message) {
  await connection.query(
    `INSERT INTO notifications (user_id, complaint_id, title, message) VALUES (?, ?, ?, ?)`,
    [userId, complaintId, title, message]
  );
}

router.get('/summary/student', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status IN ('Submitted','In Review','Assigned','In Progress')) AS active,
        SUM(status = 'Resolved') AS resolved,
        SUM(status = 'Rejected') AS rejected,
        SUM(priority = 'Critical' AND status NOT IN ('Resolved','Rejected')) AS critical
       FROM complaints WHERE student_id = ?`,
      [req.user.user_id]
    );
    const [recent] = await pool.query(
      `SELECT c.id, c.ticket_code, c.title, c.status, c.priority, c.created_at, d.name AS department_name
       FROM complaints c LEFT JOIN departments d ON d.id = c.department_id
       WHERE c.student_id = ? ORDER BY c.created_at DESC LIMIT 5`,
      [req.user.user_id]
    );
    res.json({ summary: rows[0], recent });
  } catch (error) {
    next(error);
  }
});

router.get('/summary/admin', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const [metrics] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status IN ('Submitted','In Review')) AS pending_review,
        SUM(status IN ('Assigned','In Progress')) AS in_progress,
        SUM(status = 'Resolved') AS resolved,
        SUM(priority = 'Critical' AND status NOT IN ('Resolved','Rejected')) AS critical,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(resolved_at, NOW()))), 1) AS avg_hours_open
       FROM complaints`
    );

    const [status] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM complaints GROUP BY status ORDER BY FIELD(status,'Submitted','In Review','Assigned','In Progress','Resolved','Rejected')`
    );

    const [departments] = await pool.query(
      `SELECT d.name, COUNT(c.id) AS total,
              SUM(c.status NOT IN ('Resolved','Rejected')) AS open_count,
              SUM(c.status = 'Resolved') AS resolved_count
       FROM departments d LEFT JOIN complaints c ON c.department_id = d.id
       GROUP BY d.id, d.name ORDER BY total DESC, d.name`
    );

    const [recent] = await pool.query(
      `SELECT c.id, c.ticket_code, c.title, c.status, c.priority, c.created_at,
              u.name AS student_name, d.name AS department_name
       FROM complaints c
       JOIN users u ON u.id = c.student_id
       LEFT JOIN departments d ON d.id = c.department_id
       ORDER BY c.created_at DESC LIMIT 8`
    );

    res.json({ metrics: metrics[0], status, departments, recent });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, priority, department, search, mine } = req.query;
    const values = [];
    const where = [];

    if (mine === 'true') {
      where.push('c.student_id = ?');
      values.push(req.user.user_id);
    }

    if (status && validStatuses.includes(status)) {
      where.push('c.status = ?'); values.push(status);
    }
    if (priority && validPriorities.includes(priority)) {
      where.push('c.priority = ?'); values.push(priority);
    }
    if (department && Number.isInteger(Number(department))) {
      where.push('c.department_id = ?'); values.push(Number(department));
    }
    if (search) {
      where.push('(c.ticket_code LIKE ? OR c.title LIKE ? OR c.description LIKE ? OR u.name LIKE ?)');
      const q = `%${search}%`;
      values.push(q, q, q, q);
    }

    const sql = `
      SELECT c.id, c.ticket_code, c.title, c.description, c.location, c.image_url, c.status, c.priority,
             c.created_at, c.updated_at, c.due_at, c.resolved_at, c.upvotes_count, c.rating, c.rating_feedback,
             c.student_id, c.department_id, d.name AS department_name,
             u.name AS student_name, u.email AS student_email,
             cat.name AS category_name,
             au.name AS assigned_by_name,
             EXISTS(SELECT 1 FROM complaint_upvotes WHERE complaint_id = c.id AND user_id = ?) AS has_upvoted
      FROM complaints c
      JOIN users u ON u.id = c.student_id
      LEFT JOIN departments d ON d.id = c.department_id
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN users au ON au.id = c.assigned_by
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY FIELD(c.priority,'Critical','High','Medium','Low'), c.created_at DESC`;

    const [rows] = await pool.query(sql, [req.user.user_id, ...values]);
    res.json({ complaints: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/export/csv', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.ticket_code, c.title, c.location, cat.name AS category, d.name AS department,
              c.priority, c.status, u.name AS student_name, u.email AS student_email,
              c.created_at, c.due_at, c.resolved_at, c.upvotes_count, c.rating
       FROM complaints c
       JOIN users u ON u.id = c.student_id
       LEFT JOIN departments d ON d.id = c.department_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       ORDER BY c.created_at DESC`
    );

    const headers = ['Ticket Code', 'Title', 'Location', 'Category', 'Department', 'Priority', 'Status', 'Student Name', 'Student Email', 'Created At', 'Due At', 'Resolved At', 'Upvotes', 'Rating'];
    const csvRows = [headers.join(',')];

    for (const r of rows) {
      const row = [
        `"${r.ticket_code || ''}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${(r.location || '').replace(/"/g, '""')}"`,
        `"${r.category || ''}"`,
        `"${r.department || ''}"`,
        `"${r.priority || ''}"`,
        `"${r.status || ''}"`,
        `"${(r.student_name || '').replace(/"/g, '""')}"`,
        `"${r.student_email || ''}"`,
        `"${r.created_at ? new Date(r.created_at).toISOString() : ''}"`,
        `"${r.due_at ? new Date(r.due_at).toISOString() : ''}"`,
        `"${r.resolved_at ? new Date(r.resolved_at).toISOString() : ''}"`,
        r.upvotes_count || 0,
        r.rating || ''
      ];
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="campus_complaints_audit_report.csv"');
    res.send(csvRows.join('\n'));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/upvote', authenticate, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const complaintId = Number(req.params.id);
    const userId = req.user.user_id;

    await connection.beginTransaction();
    const [existing] = await connection.query(
      'SELECT 1 FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ? LIMIT 1',
      [complaintId, userId]
    );

    let upvoted = false;
    if (existing.length) {
      await connection.query('DELETE FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ?', [complaintId, userId]);
      await connection.query('UPDATE complaints SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = ?', [complaintId]);
      upvoted = false;
    } else {
      await connection.query('INSERT INTO complaint_upvotes (complaint_id, user_id) VALUES (?, ?)', [complaintId, userId]);
      await connection.query('UPDATE complaints SET upvotes_count = upvotes_count + 1 WHERE id = ?', [complaintId]);
      upvoted = true;
    }

    const [updated] = await connection.query('SELECT upvotes_count FROM complaints WHERE id = ?', [complaintId]);
    await connection.commit();

    res.json({
      message: upvoted ? 'Upvoted complaint (+1 Me Too).' : 'Removed upvote.',
      upvoted,
      upvotesCount: updated[0]?.upvotes_count || 0
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.post('/:id/rate', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const complaintId = Number(req.params.id);
    const { rating, feedback } = req.body || {};
    const numRating = Number(rating);

    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars.' });
    }

    const [rows] = await pool.query('SELECT student_id, status FROM complaints WHERE id = ? LIMIT 1', [complaintId]);
    if (!rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    if (rows[0].student_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only the complaint author can submit resolution feedback.' });
    }
    if (rows[0].status !== 'Resolved') {
      return res.status(400).json({ message: 'Feedback can only be submitted for resolved complaints.' });
    }

    await pool.query(
      'UPDATE complaints SET rating = ?, rating_feedback = ? WHERE id = ?',
      [numRating, feedback ? feedback.trim() : null, complaintId]
    );

    res.json({ message: 'Thank you for your rating and feedback!' });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireRole('student'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { categoryId, title, description, location, priority, imageUrl } = req.body || {};
    if (!categoryId || !title || !description || !location || !priority) {
      return res.status(400).json({ message: 'Category, title, description, location and priority are required.' });
    }
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority.' });
    }

    const [categoryRows] = await connection.query(
      `SELECT c.id, c.name, c.department_id, c.default_priority, d.name AS department_name
       FROM categories c JOIN departments d ON d.id = c.department_id
       WHERE c.id = ? AND c.is_active = 1 LIMIT 1`, [categoryId]
    );
    if (!categoryRows.length) {
      return res.status(400).json({ message: 'Selected category does not exist.' });
    }

    const category = categoryRows[0];
    const dueDays = priorityDays(priority);

    await connection.beginTransaction();
    const [insert] = await connection.query(
      `INSERT INTO complaints
       (student_id, category_id, department_id, title, description, location, image_url, priority, status, due_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [req.user.user_id, category.id, category.department_id, title.trim(), description.trim(), location.trim(), imageUrl || null, priority, dueDays]
    );
    const complaintId = insert.insertId;
    const ticketCode = buildTicketCode(complaintId);
    await connection.query('UPDATE complaints SET ticket_code = ? WHERE id = ?', [ticketCode, complaintId]);
    await connection.query(
      `INSERT INTO complaint_updates (complaint_id, actor_user_id, update_type, new_status, comment)
       VALUES (?, ?, 'Status Change', 'Submitted', 'Complaint submitted by student.')`,
      [complaintId, req.user.user_id]
    );

    const [admins] = await connection.query('SELECT id FROM users WHERE role = \'admin\' AND is_active = 1');
    for (const admin of admins) {
      await addNotification(
        connection,
        admin.id,
        complaintId,
        `New complaint ${ticketCode}`,
        `${req.user.name} submitted a ${priority.toLowerCase()} priority complaint: ${title.trim()}`
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Complaint submitted successfully.', complaint: { id: complaintId, ticketCode, department: category.department_name } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const complaintId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT c.*, d.name AS department_name, u.name AS student_name, u.email AS student_email,
              cat.name AS category_name, cat.description AS category_description,
              au.name AS assigned_by_name
       FROM complaints c
       JOIN users u ON u.id = c.student_id
       LEFT JOIN departments d ON d.id = c.department_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN users au ON au.id = c.assigned_by
       WHERE c.id = ? LIMIT 1`,
      [complaintId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    const complaint = rows[0];

    const [hasUpvotedRows] = await pool.query(
      'SELECT 1 FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ? LIMIT 1',
      [complaintId, req.user.user_id]
    );
    complaint.has_upvoted = hasUpvotedRows.length > 0;

    const [upvoters] = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM complaint_upvotes cu
       JOIN users u ON u.id = cu.user_id
       WHERE cu.complaint_id = ?
       ORDER BY cu.created_at DESC`,
      [complaintId]
    );

    const [updates] = await pool.query(
      `SELECT cu.id, cu.update_type, cu.old_status, cu.new_status, cu.old_priority, cu.new_priority,
              cu.comment, cu.created_at, u.name AS actor_name, u.role AS actor_role
       FROM complaint_updates cu JOIN users u ON u.id = cu.actor_user_id
       WHERE cu.complaint_id = ? ORDER BY cu.created_at ASC`,
      [complaintId]
    );
    res.json({ complaint, updates, upvoters });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/updates', authenticate, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const complaintId = Number(req.params.id);
    const { comment } = req.body || {};
    if (!comment || !comment.trim()) return res.status(400).json({ message: 'Comment cannot be empty.' });

    const [rows] = await connection.query('SELECT * FROM complaints WHERE id = ? LIMIT 1', [complaintId]);
    if (!rows.length) return res.status(404).json({ message: 'Complaint not found.' });
    const complaint = rows[0];
    if (req.user.role === 'student' && complaint.student_id !== req.user.user_id) {
      return res.status(403).json({ message: 'You cannot comment on this complaint.' });
    }
    if (complaint.status === 'Resolved' || complaint.status === 'Rejected') {
      return res.status(400).json({ message: 'Closed complaints cannot receive new comments.' });
    }

    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO complaint_updates (complaint_id, actor_user_id, update_type, comment)
       VALUES (?, ?, ?, ?)`,
      [complaintId, req.user.user_id, req.user.role === 'admin' ? 'Authority Response' : 'Student Comment', comment.trim()]
    );

    if (req.user.role === 'student') {
      const [admins] = await connection.query('SELECT id FROM users WHERE role = \'admin\' AND is_active = 1');
      for (const admin of admins) {
        await addNotification(connection, admin.id, complaintId, `Student follow-up on ${complaint.ticket_code}`, comment.trim());
      }
    } else {
      await addNotification(connection, complaint.student_id, complaintId, `Authority update on ${complaint.ticket_code}`, comment.trim());
    }

    await connection.commit();
    res.status(201).json({ message: 'Update added.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const complaintId = Number(req.params.id);
    const { status, priority, departmentId, response } = req.body || {};
    if (status && !validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    if (priority && !validPriorities.includes(priority)) return res.status(400).json({ message: 'Invalid priority.' });

    const [rows] = await connection.query('SELECT * FROM complaints WHERE id = ? LIMIT 1', [complaintId]);
    if (!rows.length) return res.status(404).json({ message: 'Complaint not found.' });
    const current = rows[0];
    const nextStatus = status || current.status;
    const nextPriority = priority || current.priority;
    const nextDepartment = (departmentId && Number.isInteger(Number(departmentId)) && Number(departmentId) > 0)
      ? Number(departmentId)
      : current.department_id;
    
    let resolvedAtSql = 'resolved_at';
    if (current.status !== 'Resolved' && nextStatus === 'Resolved') {
      resolvedAtSql = 'NOW()';
    } else if (nextStatus !== 'Resolved') {
      resolvedAtSql = 'NULL';
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE complaints
       SET status = ?, priority = ?, department_id = ?, assigned_by = ?,
           resolved_at = ${resolvedAtSql}
       WHERE id = ?`,
      [nextStatus, nextPriority, nextDepartment, req.user.user_id, complaintId]
    );

    const changes = [];
    if (current.status !== nextStatus) changes.push(`Status changed from ${current.status} to ${nextStatus}.`);
    if (current.priority !== nextPriority) changes.push(`Priority changed from ${current.priority} to ${nextPriority}.`);
    if (current.department_id !== nextDepartment) changes.push('Complaint department was reassigned.');
    if (response && response.trim()) changes.push(response.trim());

    await connection.query(
      `INSERT INTO complaint_updates
       (complaint_id, actor_user_id, update_type, old_status, new_status, old_priority, new_priority, comment)
       VALUES (?, ?, 'Admin Update', ?, ?, ?, ?, ?)`,
      [complaintId, req.user.user_id, current.status, nextStatus, current.priority, nextPriority, changes.join(' ')]
    );

    const subject = `Update on ${current.ticket_code}`;
    const message = changes.length ? changes.join(' ') : 'Your complaint was reviewed.';
    await addNotification(connection, current.student_id, complaintId, subject, message);

    await connection.commit();
    res.json({ message: 'Complaint updated successfully.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;

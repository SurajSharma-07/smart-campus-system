import React, { useEffect, useState } from 'react';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';

const STATUS_ORDER = ['Submitted', 'In Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

function badgeClass(value) {
  return String(value).toLowerCase().replaceAll(' ', '-');
}

export default function ComplaintsPage({ role, categories, departments, onOpenComplaint }) {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', department: '' });
  const [viewMode, setViewMode] = useState('feed'); // 'feed' (all campus issues) or 'mine'
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (role === 'student' && viewMode === 'mine') {
      params.set('mine', 'true');
    }

    api.complaints(params.toString())
      .then(data => setRows(data.complaints))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
  }, [filters.search, filters.status, filters.priority, filters.department, viewMode]);

  async function toggleUpvote(e, id) {
    e.stopPropagation();
    try {
      await api.upvoteComplaint(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>{role === 'admin' ? 'Campus Complaint Registry' : viewMode === 'feed' ? '🌐 Campus Feed (All Public Issues)' : '👤 My Submitted Complaints'}</h3>
          <p>
            {role === 'admin'
              ? 'Review, assign and update every open campus complaint.'
              : viewMode === 'feed'
              ? 'Browse issues reported by students across campus. Upvote (+1) to increase resolution priority.'
              : 'Track status & updates on complaints you submitted.'}
          </p>
        </div>

        {role === 'student' && (
          <div className="feed-toggle-tabs">
            <button
              className={`tab-btn ${viewMode === 'feed' ? 'active' : ''}`}
              onClick={() => setViewMode('feed')}
            >
              🌐 Campus Feed (All)
            </button>
            <button
              className={`tab-btn ${viewMode === 'mine' ? 'active' : ''}`}
              onClick={() => setViewMode('mine')}
            >
              👤 My Submissions
            </button>
          </div>
        )}
      </div>

      <div className="filters">
        <input
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search ticket, title, student, location…"
        />
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {STATUS_ORDER.map(x => <option key={x}>{x}</option>)}
        </select>
        <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>
          {PRIORITIES.map(x => <option key={x}>{x}</option>)}
        </select>
        {role === 'admin' && (
          <select value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : rows.length ? (
        <div className="table-wrap">
          <table className="dense">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Student</th>
                <th>Issue</th>
                <th>Photo</th>
                <th>Impact (+1)</th>
                <th>Location</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} onClick={() => onOpenComplaint(c.id)} className="clickable">
                  <td><strong>{c.ticket_code}</strong></td>
                  <td>{c.student_name}</td>
                  <td>
                    <div className="table-title">{c.title}</div>
                    <small>{c.category_name}</small>
                  </td>
                  <td>{c.image_url ? <span className="photo-tag" title="Photo attached">📷 Yes</span> : <span className="muted">—</span>}</td>
                  <td>
                    <button
                      className={`mini-upvote-btn ${c.has_upvoted ? 'active' : ''}`}
                      onClick={(e) => toggleUpvote(e, c.id)}
                      title="Click to +1 this issue"
                    >
                      👍 {c.upvotes_count || 0}
                    </button>
                  </td>
                  <td>{c.location}</td>
                  <td>{c.department_name}</td>
                  <td><span className={`priority ${badgeClass(c.priority)}`}>{c.priority}</span></td>
                  <td><span className={`badge ${badgeClass(c.status)}`}>{c.status}</span></td>
                  <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No matching complaints" text="Try a different filter or submit a new complaint." />
      )}
    </div>
  );
}

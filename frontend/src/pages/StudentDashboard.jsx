import React, { useEffect, useState } from 'react';
import { api } from '../api';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';

function relative(value) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function badgeClass(value) {
  return String(value).toLowerCase().replaceAll(' ', '-');
}

export default function StudentDashboard({ setPage, onOpenComplaint }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.studentSummary()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const s = data?.summary || {};

  return (
    <>
      {error && <div className="error-box">{error}</div>}

      <div className="stats-grid four">
        <StatCard label="Total Complaints" value={s.total} hint="All submitted tickets" icon="▤" />
        <StatCard label="Active" value={s.active} hint="Currently being handled" icon="◷" accent="blue" />
        <StatCard label="Resolved" value={s.resolved} hint="Successfully closed" icon="✓" accent="green" />
        <StatCard label="Critical" value={s.critical} hint="Needs urgent attention" icon="!" accent="red" />
      </div>

      <section className="content-grid two-one">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent complaints</h3>
              <p>Latest activity from your tickets.</p>
            </div>
            <button className="ghost" onClick={() => setPage('complaints')}>View all →</button>
          </div>

          {loading ? (
            <SkeletonLoader rows={3} />
          ) : data?.recent?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Issue</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map(c => (
                    <tr key={c.id} onClick={() => onOpenComplaint(c.id)} className="clickable">
                      <td><strong>{c.ticket_code}</strong></td>
                      <td>
                        <div className="table-title">{c.title}</div>
                        <small>{c.department_name}</small>
                      </td>
                      <td><span className={`badge ${badgeClass(c.status)}`}>{c.status}</span></td>
                      <td><span className={`priority ${badgeClass(c.priority)}`}>{c.priority}</span></td>
                      <td>{relative(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No complaints yet" text="Create your first campus complaint to start tracking it." />
          )}
        </div>

        <div className="panel accent-panel">
          <div className="panel-head">
            <div>
              <h3>Report an issue</h3>
              <p>Found a campus problem?</p>
            </div>
          </div>
          <div className="quick-illustration">+</div>
          <p className="muted">Submit details, location, photo proof and priority. The system routes it to the appropriate department.</p>
          <button className="primary full" onClick={() => setPage('new')}>Create complaint</button>
        </div>
      </section>
    </>
  );
}

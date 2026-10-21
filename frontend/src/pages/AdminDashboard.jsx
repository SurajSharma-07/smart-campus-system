import React, { useEffect, useState } from 'react';
import { api } from '../api';
import StatCard from '../components/StatCard';
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

export default function AdminDashboard({ onOpenComplaint, setPage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.adminSummary().then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const maxStatus = Math.max(...(data?.status?.map(x => Number(x.count)) || [1]));

  return (
    <>
      {loading ? (
        <SkeletonLoader rows={5} />
      ) : data && (
        <>
          <div className="admin-actions-bar">
            <a href={api.exportCsvUrl()} className="primary export-btn" download>
              📥 Export Audit Report (CSV)
            </a>
          </div>

          <div className="stats-grid five">
            <StatCard label="All Complaints" value={data.metrics.total} hint="Across the campus" icon="▤" />
            <StatCard label="Pending Review" value={data.metrics.pending_review} hint="Submitted or in review" icon="◷" accent="yellow" />
            <StatCard label="In Progress" value={data.metrics.in_progress} hint="Assigned / being fixed" icon="↻" accent="blue" />
            <StatCard label="Resolved" value={data.metrics.resolved} hint="Closed successfully" icon="✓" accent="green" />
            <StatCard label="Critical Open" value={data.metrics.critical} hint="Priority escalation" icon="!" accent="red" />
          </div>

          <section className="content-grid two-one">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Resolution pipeline</h3>
                  <p>Current distribution across complaint statuses.</p>
                </div>
              </div>
              <div className="bar-chart">
                {data.status.map(s => (
                  <div className="bar-row" key={s.status}>
                    <span>{s.status}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(Number(s.count) / maxStatus) * 100}%` }} />
                    </div>
                    <strong>{s.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Service workload</h3>
                  <p>Open vs resolved by department.</p>
                </div>
              </div>
              <div className="mini-table">
                {data.departments.map(d => (
                  <div className="mini-row" key={d.name}>
                    <div>
                      <strong>{d.name}</strong>
                      <small>{d.total} total</small>
                    </div>
                    <div className="workload">
                      <span>{d.open_count || 0} open</span>
                      <span>{d.resolved_count || 0} resolved</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Recent activity</h3>
                <p>The latest complaints requiring attention.</p>
              </div>
              <button className="ghost" onClick={() => setPage('complaints')}>Open registry →</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Student</th>
                    <th>Issue</th>
                    <th>Impact</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map(c => (
                    <tr key={c.id} className="clickable" onClick={() => onOpenComplaint(c.id)}>
                      <td><strong>{c.ticket_code}</strong></td>
                      <td>{c.student_name}</td>
                      <td>{c.title}</td>
                      <td>{c.upvotes_count ? <span className="upvote-tag">🔥 {c.upvotes_count}</span> : <span className="muted">—</span>}</td>
                      <td>{c.department_name}</td>
                      <td><span className={`priority ${badgeClass(c.priority)}`}>{c.priority}</span></td>
                      <td><span className={`badge ${badgeClass(c.status)}`}>{c.status}</span></td>
                      <td>{relative(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

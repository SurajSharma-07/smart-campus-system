import React, { useEffect, useState } from 'react';
import { api } from '../api';
import EmptyState from '../components/EmptyState';

function relative(value) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function NotificationsPage({ onOpenComplaint }) {
  const [items, setItems] = useState([]);

  function load() {
    api.notifications().then(d => setItems(d.notifications));
  }

  useEffect(load, []);

  async function mark(id) {
    await api.readNotification(id);
    load();
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Notifications</h3>
          <p>Status changes, new submissions and authority responses.</p>
        </div>
      </div>
      {items.length ? (
        <div className="notifications">
          {items.map(n => (
            <div key={n.id} className={`notification ${n.is_read ? 'read' : ''}`}>
              <div className="notification-icon">{n.is_read ? '✓' : '●'}</div>
              <div>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <span>{relative(n.created_at)}</span>
              </div>
              <div className="notification-actions">
                {n.complaint_id && <button className="ghost" onClick={() => onOpenComplaint(n.complaint_id)}>View</button>}
                {!n.is_read && <button className="ghost" onClick={() => mark(n.id)}>Mark read</button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="You're all caught up" text="New complaint activity will appear here." />
      )}
    </div>
  );
}

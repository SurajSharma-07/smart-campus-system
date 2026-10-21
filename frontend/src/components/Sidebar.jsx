import React from 'react';

export default function Sidebar({ role, page, setPage, user, unread, onLogout, settings }) {
  const studentItems = [
    ['dashboard', 'Overview'],
    ['new', 'New Complaint'],
    ['complaints', 'Campus Issues'],
    ['notifications', 'Notifications']
  ];
  const adminItems = [
    ['dashboard', 'Dashboard'],
    ['complaints', 'All Complaints'],
    ['notifications', 'Notifications'],
    ['settings', 'Institution Settings']
  ];
  const items = role === 'admin' ? adminItems : studentItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          {settings?.institution_logo ? (
            <img src={settings.institution_logo} alt="Logo" className="logo-img-small" />
          ) : 'SC'}
        </div>
        <div>
          <strong>{settings?.institution_name || 'Smart Campus'}</strong>
          <small>Complaint Management</small>
        </div>
      </div>
      <div className="role-pill">{role === 'admin' ? 'AUTHORITY CONSOLE' : 'STUDENT PORTAL'}</div>
      <nav>
        {items.map(([id, label]) => (
          <button
            key={id}
            className={page === id ? 'nav-item active' : 'nav-item'}
            onClick={() => setPage(id)}
          >
            <span className="nav-icon">
              {id === 'dashboard' ? '⌂' : id === 'new' ? '+' : id === 'complaints' ? '▤' : id === 'settings' ? '⚙' : '◉'}
            </span>
            {label}
            {id === 'notifications' && unread > 0 ? <em>{unread}</em> : null}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="avatar">{user.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
          <div className="user-info">
            <strong>{user.name}</strong>
            <span>{role === 'admin' ? (user.departmentName || 'Administrator') : user.email}</span>
          </div>
        </div>
        <button className="logout" onClick={onLogout}>↪ Sign out</button>
      </div>
    </aside>
  );
}

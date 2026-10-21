import React from 'react';

export default function Topbar({ title, subtitle, user, onProfileClick, settings, theme, toggleTheme }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-right">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {settings?.institution_logo && (
          <img
            src={settings.institution_logo}
            alt="Institution Logo"
            className="topbar-institution-logo"
            title={settings.institution_name}
          />
        )}
        <button className="profile-mini" onClick={onProfileClick}>
          <div className="avatar">{user.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role === 'admin' ? 'Authority' : 'Student'}</span>
          </div>
        </button>
      </div>
    </header>
  );
}

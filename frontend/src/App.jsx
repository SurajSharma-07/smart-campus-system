import React, { useEffect, useState } from 'react';
import { api } from './api';

// Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import WatermarkBackdrop from './components/WatermarkBackdrop';
import ComplaintDrawer from './components/ComplaintDrawer';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewComplaint from './pages/NewComplaint';
import ComplaintsPage from './pages/ComplaintsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminSettings from './pages/AdminSettings';

function AppShell({ user, onLogout }) {
  const role = user.role;
  const [page, setPage] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [drawer, setDrawer] = useState(null);
  const [toast, setToast] = useState(null);
  const [unread, setUnread] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  // Dark/Light Theme state
  const [theme, setTheme] = useState(localStorage.getItem('campus_theme') || 'light');

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('campus_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function reloadSettings() {
    api.getSettings().then(d => setSettings(d.settings)).catch(() => {});
  }

  const loadNotifications = () => api.notifications().then(d => setUnread(d.notifications.filter(n => !n.is_read).length)).catch(() => {});

  useEffect(() => {
    api.categories().then(d => setCategories(d.categories));
    api.departments().then(d => setDepartments(d.departments));
    loadNotifications();
    reloadSettings();
  }, []);

  const copy = {
    student: {
      dashboard: ['Overview', 'Your campus service center'],
      new: ['New Complaint', 'Report a problem with photo proof & location details'],
      complaints: ['Campus Issues', 'Browse, track and upvote campus complaints'],
      notifications: ['Notifications', 'Stay informed about every update']
    },
    admin: {
      dashboard: ['Dashboard', 'Campus-wide operational view & CSV report export'],
      complaints: ['All Complaints', 'Manage the campus issue pipeline & department assignments'],
      notifications: ['Notifications', 'Follow new submissions and student responses'],
      settings: ['Institution Branding', 'Configure college logo watermark and title']
    }
  };

  const [title, subtitle] = copy[role][page] || copy[role].dashboard;

  function openDrawer(id) { setDrawer(id); }

  function handleSuccess(result) {
    setToast({ message: `${result.message} Ticket ${result.complaint.ticketCode} created.`, type: 'success' });
    setPage('complaints');
    loadNotifications();
  }

  async function handleLogout() {
    try { await api.logout(); } catch {}
    localStorage.removeItem('campus_token');
    onLogout();
  }

  return (
    <div className="app-shell">
      <WatermarkBackdrop settings={settings} />
      <Sidebar
        role={role}
        page={page}
        setPage={setPage}
        user={user}
        unread={unread}
        onLogout={handleLogout}
        settings={settings}
      />
      <main className="main">
        <Topbar
          title={title}
          subtitle={subtitle}
          user={user}
          onProfileClick={() => setProfileOpen(v => !v)}
          settings={settings}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        {profileOpen && (
          <div className="profile-pop">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <span>{role === 'admin' ? (user.departmentName || 'Authority') : 'Student account'}</span>
          </div>
        )}
        <div className="content">
          <div className="section-spacer" />
          {page === 'dashboard' && (role === 'admin' ? <AdminDashboard onOpenComplaint={openDrawer} setPage={setPage} /> : <StudentDashboard setPage={setPage} onOpenComplaint={openDrawer} />)}
          {page === 'new' && <NewComplaint categories={categories} onSuccess={handleSuccess} />}
          {page === 'complaints' && <ComplaintsPage role={role} categories={categories} departments={departments} onOpenComplaint={openDrawer} />}
          {page === 'notifications' && <NotificationsPage onOpenComplaint={openDrawer} />}
          {page === 'settings' && role === 'admin' && <AdminSettings settings={settings} onSettingsUpdated={reloadSettings} />}
        </div>
      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {drawer && <ComplaintDrawer id={drawer} role={role} departments={departments} onClose={() => setDrawer(null)} onChanged={loadNotifications} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getSettings().then(d => setSettings(d.settings)).catch(() => {});
    if (localStorage.getItem('campus_token')) {
      api.me()
        .then(d => setUser(d.user))
        .catch(() => localStorage.removeItem('campus_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="full-loading">Loading Smart Campus…</div>;

  return user ? <AppShell user={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} settings={settings} />;
}

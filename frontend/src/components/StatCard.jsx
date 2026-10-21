import React from 'react';

export default function StatCard({ label, value, hint, icon, accent }) {
  return (
    <div className={`stat-card ${accent || ''}`}>
      <div className="stat-head">
        <span>{label}</span>
        <div className="stat-icon">{icon}</div>
      </div>
      <strong className="stat-value">{value ?? 0}</strong>
      <span className="stat-hint">{hint}</span>
    </div>
  );
}

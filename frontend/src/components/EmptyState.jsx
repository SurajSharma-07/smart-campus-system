import React from 'react';

export default function EmptyState({ title, text }) {
  return (
    <div className="empty">
      <div className="empty-icon">◌</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

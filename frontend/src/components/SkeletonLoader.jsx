import React from 'react';

export default function SkeletonLoader({ rows = 4 }) {
  return (
    <div className="skeleton-container">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton-cell short" />
          <div className="skeleton-cell long" />
          <div className="skeleton-cell medium" />
          <div className="skeleton-cell pill" />
        </div>
      ))}
    </div>
  );
}

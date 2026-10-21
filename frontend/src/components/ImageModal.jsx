import React from 'react';

export default function ImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="overlay image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={e => e.stopPropagation()}>
        <button className="icon-button close-modal" onClick={onClose}>×</button>
        <img src={src} alt="Complaint attachment full size" />
      </div>
    </div>
  );
}

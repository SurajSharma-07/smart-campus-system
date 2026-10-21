import React from 'react';

export default function WatermarkBackdrop({ settings }) {
  if (!settings?.institution_logo && !settings?.institution_name) return null;
  return (
    <div className="watermark-overlay" aria-hidden="true">
      {settings.institution_logo ? (
        <img src={settings.institution_logo} alt="Institution Watermark" className="watermark-image" />
      ) : (
        <div className="watermark-text">{settings.institution_name || 'SMART CAMPUS'}</div>
      )}
    </div>
  );
}

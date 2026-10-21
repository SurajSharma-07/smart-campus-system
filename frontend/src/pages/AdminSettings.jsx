import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminSettings({ settings, onSettingsUpdated }) {
  const [instName, setInstName] = useState(settings?.institution_name || 'Smart Campus Institute');
  const [logoPreview, setLogoPreview] = useState(settings?.institution_logo || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (settings) {
      setInstName(settings.institution_name || '');
      setLogoPreview(settings.institution_logo || '');
    }
  }, [settings]);

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Logo image size must be less than 4MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setLogoPreview(evt.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function saveSettings(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await api.updateSettings({
        institutionName: instName,
        institutionLogo: logoPreview
      });
      setMsg({ type: 'success', text: 'Institution branding saved successfully! Watermark and logo updated across student & admin portals.' });
      onSettingsUpdated();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  function removeLogo() {
    setLogoPreview('');
  }

  return (
    <div className="panel form-panel">
      <div className="panel-head">
        <div>
          <h3>Institution Branding & Watermark Settings</h3>
          <p>Configure institution title and logo watermark that displays on all student & admin pages.</p>
        </div>
      </div>
      <form onSubmit={saveSettings} className="form-grid">
        <label className="span-2">
          Institution Name
          <input
            type="text"
            value={instName}
            onChange={e => setInstName(e.target.value)}
            placeholder="e.g. Stanford University / IIT Bombay / St. Xavier College"
            required
          />
        </label>

        <div className="span-2 image-upload-box">
          <label>Institution Logo / Watermark Image</label>
          <p className="muted" style={{ fontSize: '11px', margin: '0 0 10px' }}>
            This logo will be displayed in the application headers and as a subtle watermark background on student and admin portals.
          </p>

          {logoPreview ? (
            <div className="image-preview-wrapper logo-settings-preview">
              <img src={logoPreview} alt="Institution Logo Preview" className="logo-preview-img" />
              <button type="button" className="ghost remove-img-btn" onClick={removeLogo}>✕ Remove Logo</button>
            </div>
          ) : (
            <div className="upload-dropzone">
              <input type="file" accept="image/*" onChange={handleLogoUpload} id="logo-input" className="file-input-hidden" />
              <label htmlFor="logo-input" className="upload-label">
                <span className="upload-icon">🏛️</span>
                <strong>Upload Institution Logo / Crest</strong>
                <small>PNG, JPG, SVG or WebP transparent image recommended</small>
              </label>
            </div>
          )}
        </div>

        {msg.text && (
          <div className={`span-2 ${msg.type === 'error' ? 'error-box' : 'routing-box'}`}>
            <span>{msg.text}</span>
          </div>
        )}

        <div className="form-actions span-2">
          <button className="primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Branding Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../api';

const BUILDINGS = [
  'Academic Block A',
  'Academic Block B',
  'Central Library',
  'Science & Tech Building',
  'Boys Hostel 1',
  'Boys Hostel 2',
  'Girls Hostel 1',
  'Sports Complex & Gym',
  'Main Administrative Building',
  'Campus Cafeteria'
];

const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor'];

export default function NewComplaint({ categories, onSuccess }) {
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    building: BUILDINGS[0],
    floor: FLOORS[0],
    roomArea: '',
    priority: 'Medium',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const selectedCategory = categories.find(c => String(c.id) === String(form.categoryId));

  useEffect(() => {
    if (selectedCategory && !form.priorityTouched) {
      setForm(f => ({ ...f, priority: selectedCategory.default_priority }));
    }
  }, [selectedCategory]);

  function change(name, value) {
    setForm(f => ({
      ...f,
      [name]: value,
      ...(name === 'priority' ? { priorityTouched: true } : {})
    }));
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo file size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target.result);
      setForm(f => ({ ...f, imageUrl: evt.target.result }));
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImagePreview('');
    setForm(f => ({ ...f, imageUrl: '' }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formattedLocation = `${form.building}, ${form.floor} - ${form.roomArea.trim() || 'General Area'}`;

    try {
      const result = await api.createComplaint({
        categoryId: Number(form.categoryId),
        title: form.title,
        description: form.description,
        location: formattedLocation,
        priority: form.priority,
        imageUrl: form.imageUrl
      });
      onSuccess(result);
      setForm({
        categoryId: '',
        title: '',
        description: '',
        building: BUILDINGS[0],
        floor: FLOORS[0],
        roomArea: '',
        priority: 'Medium',
        imageUrl: ''
      });
      setImagePreview('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel form-panel">
      <div className="panel-head">
        <div>
          <h3>Submit a new complaint</h3>
          <p>Select location details, upload photo proof, and describe the problem clearly.</p>
        </div>
        <div className="workflow">
          <span>1</span>Submit <i>→</i>
          <span>2</span>Review <i>→</i>
          <span>3</span>Resolve
        </div>
      </div>

      <form onSubmit={submit} className="form-grid">
        <label>Complaint category
          <select value={form.categoryId} onChange={e => change('categoryId', e.target.value)} required>
            <option value="">Select a category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label>Priority
          <select value={form.priority} onChange={e => change('priority', e.target.value)}>
            {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
          </select>
        </label>

        <label className="span-2">Complaint title
          <input
            maxLength="150"
            value={form.title}
            onChange={e => change('title', e.target.value)}
            placeholder="e.g. Wi-Fi drops in Lab 302 / Broken bench near Room 204"
            required
          />
        </label>

        {/* Structured Campus Location Picker */}
        <label>Campus Building / Block
          <select value={form.building} onChange={e => change('building', e.target.value)}>
            {BUILDINGS.map(b => <option key={b}>{b}</option>)}
          </select>
        </label>

        <label>Floor
          <select value={form.floor} onChange={e => change('floor', e.target.value)}>
            {FLOORS.map(fl => <option key={fl}>{fl}</option>)}
          </select>
        </label>

        <label className="span-2">Room / Specific Area
          <input
            maxLength="100"
            value={form.roomArea}
            onChange={e => change('roomArea', e.target.value)}
            placeholder="e.g. Lab 302 / Washroom 2B / Near Elevator"
            required
          />
        </label>

        <label className="span-2">Describe the issue
          <textarea
            maxLength="2000"
            rows="4"
            value={form.description}
            onChange={e => change('description', e.target.value)}
            placeholder="Explain what is happening, how long it has been broken, and how it impacts students."
            required
          />
        </label>

        <div className="span-2 image-upload-box">
          <label>Photo Proof Attachment (Optional)</label>
          {imagePreview ? (
            <div className="image-preview-wrapper">
              <img src={imagePreview} alt="Complaint preview" className="image-preview" />
              <button type="button" className="ghost remove-img-btn" onClick={removeImage}>✕ Remove photo</button>
            </div>
          ) : (
            <div className="upload-dropzone">
              <input type="file" accept="image/*" onChange={handleImageUpload} id="photo-input" className="file-input-hidden" />
              <label htmlFor="photo-input" className="upload-label">
                <span className="upload-icon">📷</span>
                <strong>Click to upload photo evidence</strong>
                <small>JPEG, PNG or WebP up to 5MB</small>
              </label>
            </div>
          )}
        </div>

        {selectedCategory && (
          <div className="routing-box span-2">
            <div>
              <strong>Automatic routing</strong>
              <span>{selectedCategory.department_name}</span>
            </div>
            <small>{selectedCategory.description}</small>
          </div>
        )}

        {error && <div className="error-box span-2">{error}</div>}

        <div className="form-actions span-2">
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setForm({
                categoryId: '',
                title: '',
                description: '',
                building: BUILDINGS[0],
                floor: FLOORS[0],
                roomArea: '',
                priority: 'Medium',
                imageUrl: ''
              });
              setImagePreview('');
            }}
          >
            Clear
          </button>
          <button className="primary" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}

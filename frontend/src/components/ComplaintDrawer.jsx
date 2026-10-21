import React, { useEffect, useState } from 'react';
import { api } from '../api';
import ImageModal from './ImageModal';

const STATUS_ORDER = ['Submitted', 'In Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function badgeClass(value) {
  return String(value).toLowerCase().replaceAll(' ', '-');
}

export default function ComplaintDrawer({ id, role, departments, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [updateForm, setUpdateForm] = useState({ status: '', priority: '', departmentId: '', response: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modalImage, setModalImage] = useState(null);

  // Rating state
  const [selectedRating, setSelectedRating] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  function loadData() {
    if (id) {
      api.complaint(id)
        .then(d => {
          setData(d);
          setUpdateForm({
            status: d.complaint.status,
            priority: d.complaint.priority,
            departmentId: d.complaint.department_id || '',
            response: ''
          });
          if (d.complaint.rating) {
            setSelectedRating(d.complaint.rating);
            setRatingFeedback(d.complaint.rating_feedback || '');
            setRatingSubmitted(true);
          }
        })
        .catch(e => setError(e.message));
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (!id) return null;
  const c = data?.complaint;

  async function handleUpvote() {
    try {
      await api.upvoteComplaint(id);
      loadData();
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRateSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.rateComplaint(id, selectedRating, ratingFeedback);
      setRatingSubmitted(true);
      loadData();
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addComment() {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await api.addUpdate(id, comment);
      setComment('');
      loadData();
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateComplaint() {
    setBusy(true);
    try {
      await api.updateComplaint(id, updateForm);
      loadData();
      setUpdateForm(f => ({ ...f, response: '' }));
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="drawer">
        <div className="drawer-head">
          <div>
            <span className="ticket-kicker">{c?.ticket_code || 'Loading…'}</span>
            <h2>{c?.title || 'Complaint'}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {c ? (
          <>
            <div className="detail-grid">
              <div><span>Category</span><strong>{c.category_name}</strong></div>
              <div><span>Location</span><strong>{c.location}</strong></div>
              <div><span>Priority</span><strong className={`priority ${badgeClass(c.priority)}`}>{c.priority}</strong></div>
              <div><span>Status</span><strong className={`badge ${badgeClass(c.status)}`}>{c.status}</strong></div>
              <div><span>Department</span><strong>{c.department_name}</strong></div>
              <div><span>Target SLA</span><strong>{c.due_at ? formatDate(c.due_at) : '—'}</strong></div>
            </div>

            {/* Upvote Impact Bar */}
            <div className="upvote-bar-card">
              <div className="upvote-info">
                <strong>🔥 Affected Students ({c.upvotes_count || 0})</strong>
                <small>
                  {data?.upvoters?.length ? (
                    <>Upvoted by: <strong>{data.upvoters.map(u => u.name).join(', ')}</strong></>
                  ) : (
                    'Students experiencing or supporting this same campus issue'
                  )}
                </small>
              </div>
              <button
                className={`upvote-btn ${c.has_upvoted ? 'active' : ''}`}
                onClick={handleUpvote}
                title="Click to add or remove your support for this issue"
              >
                👍 {c.has_upvoted ? 'Me Too (+1 Added)' : '+1 Me Too'}
              </button>
            </div>

            {/* Photo Attachment View */}
            {c.image_url && (
              <div className="attachment-card" onClick={() => setModalImage(c.image_url)}>
                <div className="section-label" style={{ margin: '0 0 8px' }}>Photo proof attached</div>
                <img src={c.image_url} alt="Attached complaint proof" className="attachment-thumb" />
                <span className="attachment-hint">Click image to inspect high-resolution view</span>
              </div>
            )}

            <div className="description-box">
              <span>Student description</span>
              <p>{c.description}</p>
            </div>

            {/* Student Resolution Rating Section */}
            {c.status === 'Resolved' && (
              <div className="rating-section-card">
                <div className="section-label" style={{ margin: '0 0 8px' }}>Resolution Service Rating</div>
                {ratingSubmitted ? (
                  <div className="rating-success-box">
                    <div className="stars">{'★'.repeat(c.rating || selectedRating)}{'☆'.repeat(5 - (c.rating || selectedRating))}</div>
                    <strong>Resolution Rating: {c.rating || selectedRating} / 5 Stars</strong>
                    {c.rating_feedback && <p className="muted">"{c.rating_feedback}"</p>}
                  </div>
                ) : role === 'student' ? (
                  <form onSubmit={handleRateSubmit} className="rating-form">
                    <div className="star-picker">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          className={`star-btn ${star <= selectedRating ? 'active' : ''}`}
                          onClick={() => setSelectedRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Optional feedback on resolution speed & quality..."
                      value={ratingFeedback}
                      onChange={e => setRatingFeedback(e.target.value)}
                    />
                    <button className="primary" disabled={busy}>Submit Rating</button>
                  </form>
                ) : (
                  <span className="muted" style={{ fontSize: '11px' }}>Waiting for student resolution rating.</span>
                )}
              </div>
            )}

            {/* Admin Actions */}
            {role === 'admin' && (
              <div className="admin-update">
                <div className="section-label">Authority Action</div>
                <div className="form-grid mini">
                  <label>Status
                    <select value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                      {STATUS_ORDER.map(x => <option key={x}>{x}</option>)}
                    </select>
                  </label>
                  <label>Priority
                    <select value={updateForm.priority} onChange={e => setUpdateForm({ ...updateForm, priority: e.target.value })}>
                      {PRIORITIES.map(x => <option key={x}>{x}</option>)}
                    </select>
                  </label>
                  <label className="span-2">Assign Department
                    <select value={updateForm.departmentId} onChange={e => setUpdateForm({ ...updateForm, departmentId: e.target.value })}>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </label>
                  <label className="span-2">Official Response / Resolution Note
                    <textarea rows="3" value={updateForm.response} onChange={e => setUpdateForm({ ...updateForm, response: e.target.value })} placeholder="Explain what was checked, repaired or assigned..." />
                  </label>
                  <button className="primary span-2" onClick={updateComplaint} disabled={busy}>
                    {busy ? 'Saving…' : 'Save Authority Update'}
                  </button>
                </div>
              </div>
            )}

            <div className="section-label">Activity Timeline</div>
            <div className="timeline">
              {data.updates.map((u, i) => (
                <div className="timeline-item" key={u.id}>
                  <div className="timeline-dot">{i === data.updates.length - 1 ? '●' : '✓'}</div>
                  <div>
                    <div className="timeline-top">
                      <strong>{u.update_type}</strong>
                      <span>{formatDate(u.created_at)}</span>
                    </div>
                    <p>{u.comment || `${u.old_status || ''} → ${u.new_status || ''}`}</p>
                    <small>By {u.actor_name}</small>
                  </div>
                </div>
              ))}
            </div>

            {c.status !== 'Resolved' && c.status !== 'Rejected' && (
              <div className="comment-box">
                <textarea
                  rows="2"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={role === 'admin' ? 'Add an additional authority response…' : 'Add a follow-up comment…'}
                />
                <button className="primary" onClick={addComment} disabled={busy || !comment.trim()}>
                  Add Comment
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="loading-block">Loading complaint details…</div>
        )}
      </section>

      {modalImage && <ImageModal src={modalImage} onClose={() => setModalImage(null)} />}
    </div>
  );
}

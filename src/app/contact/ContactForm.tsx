'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    setGlobalError('');
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
      setGlobalError('Something went wrong. Please try again later.');
    }
  };

  if (status === 'success') {
    return (
      <div className="alert alert-success" role="alert" aria-live="assertive">
        <div>
          <strong>Message Sent!</strong>
          <p>Thank you for reaching out. We will get back to you as soon as possible.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
      {globalError && (
        <div className="alert alert-error" role="alert" aria-live="assertive">
          {globalError}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="name" className="form-label">Full Name <span className="required" aria-hidden="true">*</span></label>
        <input
          id="name"
          type="text"
          className="form-input"
          value={formData.name}
          onChange={(e) => { setFormData({...formData, name: e.target.value}); if(errors.name) setErrors({...errors, name: undefined}); }}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          required
        />
        <div id="name-error" className="form-error" aria-live="polite">
          {errors.name}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">Email Address <span className="required" aria-hidden="true">*</span></label>
        <input
          id="email"
          type="email"
          className="form-input"
          value={formData.email}
          onChange={(e) => { setFormData({...formData, email: e.target.value}); if(errors.email) setErrors({...errors, email: undefined}); }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
        <div id="email-error" className="form-error" aria-live="polite">
          {errors.email}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="message" className="form-label">Message <span className="required" aria-hidden="true">*</span></label>
        <textarea
          id="message"
          className="form-textarea"
          value={formData.message}
          onChange={(e) => { setFormData({...formData, message: e.target.value}); if(errors.message) setErrors({...errors, message: undefined}); }}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          rows={5}
          required
        ></textarea>
        <div id="message-error" className="form-error" aria-live="polite">
          {errors.message}
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

import { useState, useRef } from 'react';
import { Mail, Github, MessageCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Contact() {
  usePageTitle('Contact');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const sendingRef = useRef(false);

  const getMessageBody = () => {
    return `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`;
  };

  const handleEmail = async () => {
    if (sendingRef.current) return;
    
    const newErrors = {};
    if (!form.name || !form.name.trim()) newErrors.name = 'Name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.message || !form.message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    
    sendingRef.current = true;
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }
      
      setStatus({ type: 'success', message: 'Email sent successfully!' });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  const handleTelegram = () => {
    const body = encodeURIComponent(getMessageBody());
    window.open(`https://t.me/Contactm3here?text=${body}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-text mb-3">Contact Us</h1>
        <p className="text-text-secondary text-lg leading-relaxed">
          Have a question, suggestion, or found a great repository we should feature? We'd love to hear from you.
        </p>
      </div>

      <div data-tour="contact-methods" className="grid sm:grid-cols-2 gap-4 mb-10">
        <a href="mailto:openlysts@gmail.com" className="card p-5 flex items-center gap-3 card-hover">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-text text-sm">Email</h3>
            <p className="text-text-muted text-sm">openlysts@gmail.com</p>
          </div>
        </a>
        <a href="https://github.com/openlysts/Openlysts" target="_blank" rel="noopener noreferrer" className="card p-5 flex items-center gap-3 card-hover overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
            <Github className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text text-sm">GitHub</h3>
            <p className="text-text-muted text-sm truncate">openlysts/Openlysts</p>
          </div>
        </a>
      </div>

      <div data-tour="contact-form" className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            placeholder="Your name"
            className={`w-full bg-bg-card border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-accent'}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            placeholder="you@example.com"
            className={`w-full bg-bg-card border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-accent'}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Message <span className="text-red-500">*</span></label>
          <textarea
            value={form.message}
            onChange={(e) => {
              setForm({ ...form, message: e.target.value });
              if (errors.message) setErrors({ ...errors, message: null });
            }}
            placeholder="Tell us what's on your mind..."
            rows={5}
            maxLength={2000}
            className={`w-full bg-bg-card border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none resize-none ${errors.message ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-accent'}`} />
          {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
        </div>
        
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={handleEmail}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-fg font-medium text-sm transition-opacity ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}>
            <Mail className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send via Email'}
          </button>
          
          <button
            type="button"
            onClick={handleTelegram}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#229ED9] text-white font-medium text-sm hover:opacity-90 transition-opacity">
            <MessageCircle className="w-4 h-4" />
            Send via Telegram
          </button>
        </div>
        
        {status && (
          <div className={`p-3 rounded-lg text-sm font-medium text-center ${status.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
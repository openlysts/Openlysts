import { useState } from 'react';
import { Mail, Github, Send, MessageCircle } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const getMessageBody = () => {
    return `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`;
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Openlyst contact from ${form.name || 'a visitor'}`);
    const body = encodeURIComponent(getMessageBody());
    window.location.href = `mailto:reviewzxone@gmail.com?subject=${subject}&body=${body}`;
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

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <a href="mailto:reviewzxone@gmail.com" className="card p-5 flex items-center gap-3 card-hover">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-text text-sm">Email</h3>
            <p className="text-text-muted text-sm">reviewzxone@gmail.com</p>
          </div>
        </a>
        <a href="https://github.com/Adilrafiq001/Openlyst" target="_blank" rel="noopener noreferrer" className="card p-5 flex items-center gap-3 card-hover overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
            <Github className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text text-sm">GitHub</h3>
            <p className="text-text-muted text-sm truncate">Adilrafiq001/Openlyst</p>
          </div>
        </a>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            className="w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none" />
          
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none" />
          
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Message</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Tell us what's on your mind..."
            rows={5}
            className="w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none resize-none" />
          
        </div>
        
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={handleEmail}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-fg font-medium text-sm hover:opacity-90 transition-opacity">
            <Mail className="w-4 h-4" />
            Send via Email
          </button>
          
          <button
            type="button"
            onClick={handleTelegram}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#229ED9] text-white font-medium text-sm hover:opacity-90 transition-opacity">
            <MessageCircle className="w-4 h-4" />
            Send via Telegram
          </button>
        </div>
      </div>
    </div>
  );
}
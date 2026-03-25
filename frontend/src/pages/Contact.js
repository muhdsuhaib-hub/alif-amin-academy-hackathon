import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error('Please fill in all fields'); return; }
    setSending(true);
    // Simulate send — replace with real endpoint when ready
    await new Promise(r => setTimeout(r, 800));
    toast.success('Message sent! We\'ll get back to you shortly.');
    setForm({ name: '', email: '', message: '' });
    setSending(false);
  };

  const inputCls = "bg-white rounded-xl border border-gray-300 focus:border-[#0f2e24] focus:ring-1 focus:ring-[#0f2e24] p-4 w-full mb-6 font-['Bricolage_Grotesque'] shadow-sm outline-none transition-all";

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#0f2e24] py-24 px-8 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm font-['Bricolage_Grotesque'] hover:underline mb-12 inline-flex items-center gap-2">&larr; Back to Home</Link>

        <h1 className="font-['Libre_Baskerville'] text-5xl md:text-6xl mb-8 leading-tight">Contact Us</h1>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-12 opacity-85">Have a question about our classes, pricing, or becoming a tutor? We're here to help.</p>

        <form onSubmit={handleSubmit} className="max-w-xl" data-testid="contact-form">
          <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} data-testid="contact-name" />
          <input type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} data-testid="contact-email" />
          <textarea placeholder="How can we help you?" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={inputCls + ' resize-none'} data-testid="contact-message" />
          <button type="submit" disabled={sending}
            className="bg-[#0f2e24] text-white rounded-xl py-4 px-8 font-bold text-lg hover:opacity-90 transition-all w-full md:w-auto font-['Bricolage_Grotesque'] disabled:opacity-50"
            data-testid="contact-submit">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className="mt-16 pt-12 border-t border-[#0f2e24]/10">
          <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85">You can also reach us directly at:</p>
          <p className="font-['Bricolage_Grotesque'] text-lg font-semibold mt-2">hello.alifamin@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

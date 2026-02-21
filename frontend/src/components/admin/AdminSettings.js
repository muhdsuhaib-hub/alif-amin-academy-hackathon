import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Key, Save, Shield, Plus, Trash2, Lock, Eye, EyeOff, X, Edit, Check } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FIELDS = [
  { key: 'billplz_api_key', label: 'Billplz API Key', desc: 'Payment gateway' },
  { key: 'billplz_collection_id', label: 'Billplz Collection ID', desc: 'Collection for payments' },
  { key: 'gcs_credentials_json', label: 'GCS JSON Credentials', desc: 'Google Cloud Storage', multi: true },
  { key: 'whatsapp_api_key', label: 'WhatsApp API Key', desc: 'WhatsApp notifications' },
  { key: 'smtp_email', label: 'SMTP Email', desc: 'Email sender address' },
  { key: 'smtp_password', label: 'SMTP Password', desc: 'Email sender password' },
];

function PinModal({ mode, onVerified, onClose }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'create') {
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) { toast.error('PIN must be 6 digits'); return; }
      if (pin !== confirmPin) { toast.error('PINs do not match'); return; }
      setLoading(true);
      try {
        const r = await fetch(`${API}/admin/admin-pin/set`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ pin }) });
        if (r.ok) { toast.success('Security PIN created'); onVerified(pin); }
        else toast.error('Failed to set PIN');
      } catch { toast.error('Error'); }
      finally { setLoading(false); }
    } else {
      setLoading(true);
      try {
        const r = await fetch(`${API}/admin/admin-pin/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ pin }) });
        if (r.ok) onVerified(pin);
        else toast.error('Invalid PIN');
      } catch { toast.error('Error'); }
      finally { setLoading(false); }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="pin-modal">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <Lock className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">{mode === 'create' ? 'Create Security PIN' : 'Verify Security PIN'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'create' && <p className="text-xs text-slate-500">Set a 6-digit PIN to protect sensitive operations.</p>}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{mode === 'create' ? 'New 6-Digit PIN' : 'Enter PIN'}</label>
            <input type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-lg text-center font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500/20" autoFocus data-testid="pin-input" />
          </div>
          {mode === 'create' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm PIN</label>
              <input type="password" maxLength={6} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-lg text-center font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="pin-confirm" />
            </div>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 h-11 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-all disabled:opacity-60" data-testid="pin-submit">{loading ? 'Verifying...' : mode === 'create' ? 'Create PIN' : 'Unlock'}</button>
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [unlocked, setUnlocked] = useState(false);
  const [pinMode, setPinMode] = useState(null); // 'create' | 'verify' | null
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [customName, setCustomName] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  const checkPin = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/admin-pin/status`, { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        setPinMode(d.has_pin ? 'verify' : 'create');
      }
    } catch { setPinMode('verify'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { checkPin(); }, [checkPin]);

  const fetchSettings = async () => {
    try { const r = await fetch(`${API}/admin/settings`, { credentials: 'include' }); if (r.ok) setSettings(await r.json()); }
    catch { toast.error('Failed'); }
  };

  const handleUnlocked = (pin) => { setUnlocked(true); setPinMode(null); localStorage.setItem('_admin_pin_cache', pin); fetchSettings(); };

  const handleSave = async () => {
    const pin = localStorage.getItem('_admin_pin_cache');
    if (!pin) { toast.error('Session expired. Re-enter PIN.'); setUnlocked(false); setPinMode('verify'); return; }
    setSaving(true);
    const updates = {};
    FIELDS.forEach(f => { if (settings[f.key] && settings[f.key] !== '********') updates[f.key] = settings[f.key]; });
    const customKeys = [];
    if (customName && customValue) customKeys.push({ name: customName, value: customValue });

    try {
      const r = await fetch(`${API}/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ updates, custom_keys: customKeys.length ? customKeys : undefined, admin_pin: pin }) });
      if (r.ok) { toast.success('Settings saved & encrypted'); setCustomName(''); setCustomValue(''); fetchSettings(); }
      else { const e = await r.json(); toast.error(e.detail || 'Failed'); if (e.detail === 'Invalid PIN') { setUnlocked(false); setPinMode('verify'); } }
    } catch { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const handleDeleteKey = async (keyName) => {
    const pin = localStorage.getItem('_admin_pin_cache');
    if (!pin) { toast.error('Session expired. Re-enter PIN.'); setUnlocked(false); setPinMode('verify'); return; }
    try {
      const r = await fetch(`${API}/admin/settings/custom-key/${encodeURIComponent(keyName)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ admin_pin: pin }) });
      if (r.ok) { toast.success(`Deleted "${keyName}"`); fetchSettings(); }
      else { const e = await r.json(); toast.error(e.detail || 'Failed'); }
    } catch { toast.error('Error deleting key'); }
  };

  const handleEditKey = async (keyName) => {
    const pin = localStorage.getItem('_admin_pin_cache');
    if (!pin) { toast.error('Session expired. Re-enter PIN.'); setUnlocked(false); setPinMode('verify'); return; }
    if (!editValue.trim()) { toast.error('Value is required'); return; }
    try {
      const r = await fetch(`${API}/admin/settings/custom-key/${encodeURIComponent(keyName)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ value: editValue, admin_pin: pin }) });
      if (r.ok) { toast.success(`Updated "${keyName}"`); setEditingKey(null); setEditValue(''); fetchSettings(); }
      else { const e = await r.json(); toast.error(e.detail || 'Failed'); }
    } catch { toast.error('Error updating key'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  if (!unlocked && pinMode) return <PinModal mode={pinMode} onVerified={handleUnlocked} onClose={() => setPinMode(null)} />;

  return (
    <div className="space-y-6 max-w-2xl" data-testid="admin-settings">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-slate-900">Integrations & Settings</h2><p className="text-xs text-slate-500">Encrypted at rest with Fernet AES</p></div>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full"><Shield className="w-3 h-3" />Vault Unlocked</span>
      </div>

      <Card className="p-5 space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1"><Key className="w-3 h-3 text-slate-400" />{f.label}</label>
            <p className="text-[10px] text-slate-400 mb-1.5">{f.desc}</p>
            {f.multi ? (
              <textarea value={settings[f.key] || ''} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Paste JSON here..." data-testid={`setting-${f.key}`} />
            ) : (
              <div className="relative">
                <input type={showKeys[f.key] ? 'text' : 'password'} value={settings[f.key] || ''} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} className="h-10 w-full rounded-xl border border-slate-200 px-4 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid={`setting-${f.key}`} />
                <button onClick={() => setShowKeys(s => ({ ...s, [f.key]: !s[f.key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100">{showKeys[f.key] ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}</button>
              </div>
            )}
          </div>
        ))}

        {/* Custom Keys */}
        <div className="border-t border-slate-100 pt-5">
          <h4 className="text-xs font-semibold text-slate-700 mb-3">Custom Keys</h4>
          {(settings.custom_keys || []).map((ck, i) => (
            <div key={i} className="flex items-center gap-2 mb-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600 flex-1">{ck.name}</span>
              <span className="text-[10px] text-emerald-600 font-mono">********</span>
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2 mt-2">
            <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Key Name" className="col-span-2 h-9 rounded-lg border border-slate-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="custom-key-name" />
            <input type="password" value={customValue} onChange={e => setCustomValue(e.target.value)} placeholder="Value" className="col-span-2 h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="custom-key-value" />
            <button onClick={() => { if (customName && customValue) { handleSave(); } else toast.error('Both fields required'); }} className="h-9 rounded-lg bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </Card>

      <button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60" data-testid="save-settings-btn">
        <Save className="w-4 h-4" />{saving ? 'Encrypting & Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

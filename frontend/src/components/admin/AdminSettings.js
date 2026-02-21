import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FIELDS = [
  { key: 'billplz_api_key', label: 'Billplz API Key', description: 'Payment gateway API key for Malaysian payments' },
  { key: 'billplz_collection_id', label: 'Billplz Collection ID', description: 'Collection ID for receiving payments' },
  { key: 'gcs_credentials_json', label: 'Google Cloud JSON Credentials', description: 'Service account credentials for GCS file storage', multiline: true },
  { key: 'whatsapp_api_key', label: 'WhatsApp API Key', description: 'For sending WhatsApp notifications to students and teachers' },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({});

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try { const r = await fetch(`${API}/admin/settings`, { credentials: 'include' }); if (r.ok) setSettings(await r.json()); }
    catch { toast.error('Failed to load settings'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {};
      FIELDS.forEach(f => { if (settings[f.key] && !settings[f.key].includes('****')) body[f.key] = settings[f.key]; });
      if (Object.keys(body).length === 0) { toast.info('No changes to save'); setSaving(false); return; }
      const r = await fetch(`${API}/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (r.ok) { toast.success('Settings saved'); fetchSettings(); }
      else toast.error('Failed to save');
    } catch { toast.error('Error saving'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6 max-w-2xl" data-testid="admin-settings">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Integrations & Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage API keys and cloud service credentials</p>
      </div>

      <Card className="p-1">
        <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/50 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Security Notice</p>
            <p className="text-[11px] text-amber-700 mt-0.5">API keys are encrypted at rest. After saving, keys are masked for security. To update a key, enter the full new value.</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />{field.label}
              </label>
              <p className="text-[10px] text-slate-400 mb-2">{field.description}</p>
              <div className="relative">
                {field.multiline ? (
                  <textarea
                    value={settings[field.key] || ''}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    placeholder={`Enter ${field.label}...`}
                    data-testid={`setting-${field.key}`}
                  />
                ) : (
                  <input
                    type={showKeys[field.key] ? 'text' : 'password'}
                    value={settings[field.key] || ''}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 pr-11 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder={`Enter ${field.label}...`}
                    data-testid={`setting-${field.key}`}
                  />
                )}
                {!field.multiline && (
                  <button
                    onClick={() => setShowKeys(s => ({ ...s, [field.key]: !s[field.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    data-testid={`toggle-${field.key}`}
                  >
                    {showKeys[field.key] ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        data-testid="save-settings-btn"
      >
        <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

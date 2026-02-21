import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, X, Save, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ACTIVITY_TYPES = ['Quiz', 'Flashcard', 'Tajweed Match', 'Pronunciation Drill', 'Word Tracing'];

export default function ContentLibrary() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', activity_type: 'Quiz', description: '', payload: '{}' });

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    try { const r = await fetch(`${API}/admin/activities`, { credentials: 'include' }); if (r.ok) setActivities((await r.json()).activities || []); }
    catch { toast.error('Failed to load activities'); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', activity_type: 'Quiz', description: '', payload: '{}' }); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); setForm({ title: a.title, activity_type: a.activity_type, description: a.description || '', payload: JSON.stringify(a.payload || {}, null, 2) }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    let parsedPayload;
    try { parsedPayload = JSON.parse(form.payload); } catch { toast.error('Invalid JSON payload'); return; }
    const body = { title: form.title, activity_type: form.activity_type, description: form.description, payload: parsedPayload };

    try {
      const url = editing ? `${API}/admin/activities/${editing.activity_id}` : `${API}/admin/activities`;
      const r = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (r.ok) { toast.success(editing ? 'Activity updated' : 'Activity created'); setShowModal(false); fetchActivities(); }
      else { const e = await r.json(); toast.error(e.detail || 'Failed'); }
    } catch { toast.error('Error saving'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try { const r = await fetch(`${API}/admin/activities/${id}`, { method: 'DELETE', credentials: 'include' }); if (r.ok) { toast.success('Deleted'); fetchActivities(); } }
    catch { toast.error('Failed'); }
  };

  const getTypeBadge = (t) => {
    const cls = { Quiz: 'bg-blue-50 text-blue-700', Flashcard: 'bg-amber-50 text-amber-700', 'Tajweed Match': 'bg-emerald-50 text-emerald-700' }[t] || 'bg-slate-50 text-slate-600';
    return <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${cls}`}>{t}</span>;
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6" data-testid="content-library">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-slate-900">Content Library</h2><p className="text-xs text-slate-500 mt-0.5">{activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-all" data-testid="create-activity-btn">
          <Plus className="w-4 h-4" />New Activity
        </button>
      </div>

      {activities.length === 0 ? (
        <Card className="p-12 text-center"><BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-sm text-slate-500">No activities yet. Create your first one!</p></Card>
      ) : (
        <div className="grid gap-3">
          {activities.map((a) => (
            <Card key={a.activity_id} className="p-5 hover:shadow-md transition-all" data-testid={`activity-${a.activity_id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{a.title}</h3>
                    {getTypeBadge(a.activity_type)}
                    {a.is_active === false && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">Inactive</span>}
                  </div>
                  {a.description && <p className="text-xs text-slate-500 line-clamp-1">{a.description}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">Created {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" data-testid={`edit-activity-${a.activity_id}`}><Edit className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => handleDelete(a.activity_id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" data-testid={`delete-activity-${a.activity_id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} data-testid="activity-modal">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{editing ? 'Edit Activity' : 'New Activity'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Title</label><input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="activity-title-input" /></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label><select value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="activity-type-select">{ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label><input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5"><FileCode className="w-3.5 h-3.5" />JSON Payload</label>
                <textarea value={form.payload} onChange={e => setForm(f => ({ ...f, payload: e.target.value }))} rows={8} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" data-testid="activity-payload-input" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={handleSave} className="flex-1 h-11 rounded-xl bg-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all" data-testid="save-activity-btn"><Save className="w-4 h-4" />{editing ? 'Update' : 'Create'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

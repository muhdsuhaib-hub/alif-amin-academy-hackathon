import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TYPES = ['Quiz', 'Flashcard', 'Tajweed Match', 'Pronunciation Drill', 'Word Tracing', 'Doa Practice', 'Hadith Practice'];
const PAGE_SIZE = 10;

const EMPTY_ITEMS = {
  'Quiz': () => ({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A' }),
  'Flashcard': () => ({ front: '', back: '' }),
  'Tajweed Match': () => ({ concept: '', example: '' }),
  'Pronunciation Drill': () => ({ word: '', transliteration: '', focusRule: '' }),
  'Word Tracing': () => ({ word: '', translation: '' }),
  'Doa Practice': () => ({ title: '', arabic: '', translation: '' }),
  'Hadith Practice': () => ({ reference: '', arabic: '', translation: '' }),
};

function VisualFormFields({ type, items, setItems }) {
  const addItem = () => setItems([...items, EMPTY_ITEMS[type]()]);
  const update = (idx, field, val) => { const c = [...items]; c[idx] = { ...c[idx], [field]: val }; setItems(c); };
  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));

  const inputCls = 'h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20';
  const labels = { 'Quiz': 'Question', 'Flashcard': 'Card', 'Tajweed Match': 'Pair', 'Pronunciation Drill': 'Drill', 'Word Tracing': 'Word', 'Doa Practice': 'Doa', 'Hadith Practice': 'Hadith' };

  return (
    <div className="space-y-3" data-testid="visual-form">
      {items.map((item, idx) => (
        <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5 relative group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">{labels[type] || 'Item'} {idx + 1}</span>
            {items.length > 1 && <button onClick={() => remove(idx)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"><Trash2 className="w-3 h-3 text-red-400" /></button>}
          </div>

          {type === 'Quiz' && (<>
            <input placeholder="Question text" value={item.question} onChange={e => update(idx, 'question', e.target.value)} className={inputCls} data-testid={`quiz-question-${idx}`} />
            <div className="grid grid-cols-2 gap-2">
              {['A','B','C','D'].map(o => <input key={o} placeholder={`Option ${o}`} value={item[`option${o}`]} onChange={e => update(idx, `option${o}`, e.target.value)} className={inputCls} data-testid={`quiz-option${o}-${idx}`} />)}
            </div>
            <select value={item.correct} onChange={e => update(idx, 'correct', e.target.value)} className={inputCls} data-testid={`quiz-correct-${idx}`}>
              {['A','B','C','D'].map(o => <option key={o} value={o}>Correct: {o}</option>)}
            </select>
          </>)}

          {type === 'Flashcard' && (<>
            <input placeholder="Front Text (Arabic/Term)" value={item.front} onChange={e => update(idx, 'front', e.target.value)} className={inputCls} data-testid={`flash-front-${idx}`} />
            <input placeholder="Back Text (Translation)" value={item.back} onChange={e => update(idx, 'back', e.target.value)} className={inputCls} data-testid={`flash-back-${idx}`} />
          </>)}

          {type === 'Tajweed Match' && (<>
            <input placeholder="Concept (e.g., Ikhfa)" value={item.concept} onChange={e => update(idx, 'concept', e.target.value)} className={inputCls} />
            <input placeholder="Matching Example" value={item.example} onChange={e => update(idx, 'example', e.target.value)} className={inputCls} />
          </>)}

          {type === 'Pronunciation Drill' && (<>
            <input placeholder="Arabic Word/Ayah" value={item.word} onChange={e => update(idx, 'word', e.target.value)} className={inputCls} />
            <input placeholder="Transliteration" value={item.transliteration} onChange={e => update(idx, 'transliteration', e.target.value)} className={inputCls} />
            <input placeholder="Focus Letter/Rule" value={item.focusRule} onChange={e => update(idx, 'focusRule', e.target.value)} className={inputCls} />
          </>)}

          {type === 'Word Tracing' && (<>
            <input placeholder="Arabic Word" value={item.word} onChange={e => update(idx, 'word', e.target.value)} className={inputCls} />
            <input placeholder="Translation" value={item.translation} onChange={e => update(idx, 'translation', e.target.value)} className={inputCls} />
          </>)}

          {type === 'Doa Practice' && (<>
            <input placeholder="Doa Title" value={item.title} onChange={e => update(idx, 'title', e.target.value)} className={inputCls} />
            <input placeholder="Arabic Text" value={item.arabic} onChange={e => update(idx, 'arabic', e.target.value)} className={inputCls} />
            <input placeholder="Translation/Meaning" value={item.translation} onChange={e => update(idx, 'translation', e.target.value)} className={inputCls} />
          </>)}

          {type === 'Hadith Practice' && (<>
            <input placeholder="Hadith Reference" value={item.reference} onChange={e => update(idx, 'reference', e.target.value)} className={inputCls} />
            <input placeholder="Arabic Text" value={item.arabic} onChange={e => update(idx, 'arabic', e.target.value)} className={inputCls} />
            <input placeholder="Translation" value={item.translation} onChange={e => update(idx, 'translation', e.target.value)} className={inputCls} />
          </>)}
        </div>
      ))}
      <button onClick={addItem} className="w-full h-10 rounded-xl border-2 border-dashed border-slate-200 text-xs font-medium text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-1.5" data-testid="add-item-btn">
        <Plus className="w-3.5 h-3.5" />Add Another {labels[type] || 'Item'}
      </button>
    </div>
  );
}

function payloadToItems(type, payload) {
  const items = payload?.items || payload?.questions || payload?.cards || payload?.pairs || payload?.drills || payload?.words || payload?.duas || payload?.hadiths || [];
  if (items.length === 0) return [EMPTY_ITEMS[type]()];
  return items;
}

function itemsToPayload(type, items) {
  const key = { 'Quiz': 'questions', 'Flashcard': 'cards', 'Tajweed Match': 'pairs', 'Pronunciation Drill': 'drills', 'Word Tracing': 'words', 'Doa Practice': 'duas', 'Hadith Practice': 'hadiths' }[type] || 'items';
  return { [key]: items };
}

export default function ContentLibrary() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', activity_type: 'Quiz', description: '' });
  const [items, setItems] = useState([EMPTY_ITEMS['Quiz']()]);

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    try { const r = await fetch(`${API}/admin/activities`, { credentials: 'include' }); if (r.ok) setActivities((await r.json()).activities || []); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', activity_type: 'Quiz', description: '' }); setItems([EMPTY_ITEMS['Quiz']()]); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); setForm({ title: a.title, activity_type: a.activity_type, description: a.description || '' }); setItems(payloadToItems(a.activity_type, a.payload)); setShowModal(true); };

  const handleTypeChange = (t) => { setForm(f => ({ ...f, activity_type: t })); setItems([EMPTY_ITEMS[t]()]); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    const body = { title: form.title, activity_type: form.activity_type, description: form.description, payload: itemsToPayload(form.activity_type, items) };
    try {
      const url = editing ? `${API}/admin/activities/${editing.activity_id}` : `${API}/admin/activities`;
      const r = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (r.ok) { toast.success(editing ? 'Updated' : 'Created'); setShowModal(false); fetchActivities(); }
      else { const e = await r.json(); toast.error(e.detail || 'Failed'); }
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { const r = await fetch(`${API}/admin/activities/${id}`, { method: 'DELETE', credentials: 'include' }); if (r.ok) { toast.success('Deleted'); fetchActivities(); } } catch { toast.error('Failed'); } };

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const paged = activities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const typeBadge = (t) => { const c = { Quiz: 'bg-blue-50 text-blue-700', Flashcard: 'bg-amber-50 text-amber-700', 'Tajweed Match': 'bg-emerald-50 text-emerald-700', 'Doa Practice': 'bg-purple-50 text-purple-700', 'Hadith Practice': 'bg-teal-50 text-teal-700' }[t] || 'bg-slate-50 text-slate-600'; return <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${c}`}>{t}</span>; };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6" data-testid="content-library">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-slate-900">Content Library</h2><p className="text-xs text-slate-500 mt-0.5">{activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-all" data-testid="create-activity-btn"><Plus className="w-4 h-4" />New Activity</button>
      </div>

      {activities.length === 0 ? (
        <Card className="p-12 text-center"><BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-sm text-slate-500">No activities yet.</p></Card>
      ) : (
        <div className="grid gap-3">
          {paged.map((a) => {
            const count = Object.values(a.payload || {}).flat().length;
            return (
              <Card key={a.activity_id} className="p-5 hover:shadow-md transition-all" data-testid={`activity-${a.activity_id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5"><h3 className="text-sm font-semibold text-slate-900 truncate">{a.title}</h3>{typeBadge(a.activity_type)}<span className="text-[10px] text-slate-400">{count} item{count !== 1 ? 's' : ''}</span></div>
                    {a.description && <p className="text-xs text-slate-500 line-clamp-1">{a.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" data-testid={`edit-activity-${a.activity_id}`}><Edit className="w-4 h-4 text-slate-400" /></button>
                    <button onClick={() => handleDelete(a.activity_id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" data-testid={`delete-activity-${a.activity_id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">Page {page}/{totalPages}</p>
              <div className="flex gap-1.5"><button onClick={() => setPage(Math.max(1, page-1))} disabled={page===1} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page===totalPages} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} data-testid="activity-modal">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-900">{editing ? 'Edit Activity' : 'New Activity'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Title</label><input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="activity-title-input" /></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label><select value={form.activity_type} onChange={e => handleTypeChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="activity-type-select">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label><input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Content</label><VisualFormFields type={form.activity_type} items={items} setItems={setItems} /></div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
              <button onClick={handleSave} className="flex-1 h-11 rounded-xl bg-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all" data-testid="save-activity-btn"><Save className="w-4 h-4" />{editing ? 'Update' : 'Create'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

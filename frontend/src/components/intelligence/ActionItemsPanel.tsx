import { useState } from 'react';
import { ListTodo, Pencil, Check, X, User, Clock, ChevronDown } from 'lucide-react';
import type { ActionItem } from '@/types/api';
import { updateActionItems } from '@/services/api';

interface ActionItemsPanelProps {
    actionItems: ActionItem[] | null;
    recordingId: string;
    onUpdated?: (items: ActionItem[]) => void;
}

type Status = 'Pending' | 'In Progress' | 'Completed';
const STATUS_OPTIONS: Status[] = ['Pending', 'In Progress', 'Completed'];

const statusClass = (s: string) => {
    if (s === 'Completed') return 'status-completed';
    if (s === 'In Progress') return 'status-in-progress';
    return 'status-pending';
};

interface EditableItem {
    task: string;
    assignee: string;
    deadline: string | null;
    status: Status;
}

export const ActionItemsPanel = ({ actionItems, recordingId, onUpdated }: ActionItemsPanelProps) => {
    const [items, setItems] = useState<EditableItem[]>(() =>
        (actionItems || []).map(ai => ({
            task: ai.task || '',
            assignee: ai.assignee || 'Unassigned',
            deadline: ai.deadline || null,
            status: (ai.status as Status) || 'Pending',
        }))
    );
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<EditableItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    if (!actionItems || actionItems.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 p-6">
                <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl border border-slate-100">
                    <ListTodo size={24} className="opacity-50 text-slate-500" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">No action items found</p>
                    <p className="text-xs mt-1 max-w-[200px] leading-relaxed mx-auto">Action items extracted from your meetings will appear here.</p>
                </div>
            </div>
        );
    }

    const startEdit = (i: number) => {
        setEditingIndex(i);
        setDraft({ ...items[i] });
        setSaveError(null);
    };

    const cancelEdit = () => { setEditingIndex(null); setDraft(null); };

    const saveAll = async (newItems: EditableItem[]) => {
        setSaving(true);
        setSaveError(null);
        try {
            const result = await updateActionItems(recordingId, newItems);
            const saved = (result.action_items || []).map(ai => ({
                task: ai.task || '',
                assignee: ai.assignee || 'Unassigned',
                deadline: (ai as any).deadline || null,
                status: ((ai as any).status as Status) || 'Pending',
            }));
            setItems(saved);
            onUpdated?.(result.action_items || []);
        } catch {
            setSaveError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const commitEdit = async (i: number) => {
        if (!draft || !draft.task.trim()) { setSaveError('Task cannot be empty.'); return; }
        const newItems = items.map((it, idx) => idx === i ? { ...draft } : it);
        await saveAll(newItems);
        setEditingIndex(null);
        setDraft(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Action Items</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
            </div>

            {saveError && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold">!</span>
                    {saveError}
                </div>
            )}

            <div className="space-y-2.5">
                {items.map((item, i) => (
                    <div key={i} className={`bg-white border rounded-xl p-3.5 transition-all shadow-sm ${editingIndex === i ? 'border-indigo-300 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        {editingIndex === i && draft ? (
                            /* ── Edit Mode ── */
                            <div className="space-y-3">
                                <textarea
                                    value={draft.task}
                                    onChange={e => setDraft({ ...draft, task: e.target.value })}
                                    rows={2}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                                    placeholder="Task description..."
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div className="relative">
                                        <User size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                                        <input
                                            value={draft.assignee}
                                            onChange={e => setDraft({ ...draft, assignee: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Assignee"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Clock size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                                        <input
                                            value={draft.deadline || ''}
                                            onChange={e => setDraft({ ...draft, deadline: e.target.value || null })}
                                            className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                                            placeholder="Due date"
                                        />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={draft.status}
                                            onChange={e => setDraft({ ...draft, status: e.target.value as Status })}
                                            className="appearance-none w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                                        >
                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1 border-t border-slate-100">
                                    <button
                                        onClick={() => commitEdit(i)}
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded-lg transition-colors shadow-sm disabled:opacity-60 font-semibold active:scale-[0.98]"
                                    >
                                        <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs py-2 rounded-lg transition-colors font-medium shadow-sm active:scale-[0.98]"
                                    >
                                        <X size={14} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── View Mode ── */
                            <div className="group">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <p className="text-slate-800 text-sm font-medium leading-relaxed flex-1">{item.task}</p>
                                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusClass(item.status)}`}>
                                            {item.status}
                                        </span>
                                        <button
                                            onClick={() => startEdit(i)}
                                            title="Edit"
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg opacity-0 group-hover:opacity-100"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <User size={10} className="text-slate-400" />
                                        </div>
                                        <span className="text-slate-700">{item.assignee}</span>
                                    </span>
                                    {item.deadline && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="flex items-center gap-1.5 text-slate-600">
                                                <Clock size={12} className="text-slate-400" />
                                                Due: <span className="text-slate-700 font-semibold">{item.deadline}</span>
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

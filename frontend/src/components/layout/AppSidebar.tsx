import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Check, X, MoreHorizontal, Bot, Trash2, Mic, ChevronRight } from 'lucide-react';
import {
    getWorkspaces, createWorkspace, renameWorkspace, deleteWorkspace,
    getErrorMessage,
} from '@/services/api';
import type { WorkspaceItem } from '@/types/api';

interface AppSidebarProps {
    activeWorkspaceId: string | null;
    onSelectWorkspace: (id: string) => void;
}

export const AppSidebar = ({ activeWorkspaceId, onSelectWorkspace }: AppSidebarProps) => {
    const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [renameError, setRenameError] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const load = async () => {
        try {
            const data = await getWorkspaces();
            setWorkspaces(data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const ws = await createWorkspace('New Workspace');
            await load();
            onSelectWorkspace(ws.id);
        } finally { setCreating(false); }
    };

    const startRename = (ws: WorkspaceItem) => {
        setMenuOpenId(null);
        setRenamingId(ws.id);
        setRenameValue(ws.title);
        setRenameError(null);
    };

    const commitRename = async (id: string) => {
        const trimmed = renameValue.trim();
        if (!trimmed) { setRenameError('Name cannot be empty'); return; }
        if (trimmed.length > 80) { setRenameError('Max 80 characters'); return; }
        try {
            await renameWorkspace(id, trimmed);
            await load();
        } catch (e) { setRenameError(getErrorMessage(e)); return; }
        setRenamingId(null);
    };

    const handleDelete = async (id: string) => {
        setMenuOpenId(null);
        try {
            await deleteWorkspace(id);
            await load();
            if (activeWorkspaceId === id) onSelectWorkspace('');
        } catch { /* ignore */ }
    };

    return (
        <aside className="w-[280px] flex-shrink-0 h-full flex flex-col bg-white border-r border-slate-200">
            {/* Brand */}
            <Link to="/" className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 flex-shrink-0 bg-white hover:bg-slate-50 transition-colors cursor-pointer outline-none focus:ring-inset focus:ring-2 focus:ring-indigo-500">
                <div className="w-8 h-8 rounded-[10px] bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30 text-white">
                    <Mic size={16} strokeWidth={2.5} />
                </div>
                <span className="font-display font-bold text-slate-900 text-lg tracking-tight">MeetingMind</span>
            </Link>

            {/* Workspace Label + Add */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-shrink-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Workspaces</span>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    title="New workspace"
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Workspace List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                {loading ? (
                    <div className="flex items-center gap-2 px-2 py-4 text-slate-400 text-sm">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                        Loading...
                    </div>
                ) : workspaces.length === 0 ? (
                    <div className="px-2 py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                        No workspaces yet.<br />
                        <button onClick={handleCreate} className="text-indigo-600 hover:text-indigo-700 mt-2 font-medium">
                            Create your first
                        </button>
                    </div>
                ) : (
                    workspaces.map(ws => {
                        const isActive = ws.id === activeWorkspaceId;
                        const isRenaming = renamingId === ws.id;
                        return (
                            <div key={ws.id} className="relative group">
                                {isRenaming ? (
                                    <div className="px-2 py-2 bg-slate-50 border border-indigo-200 rounded-xl shadow-sm">
                                        <input
                                            autoFocus
                                            value={renameValue}
                                            onChange={e => { setRenameValue(e.target.value); setRenameError(null); }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') commitRename(ws.id);
                                                if (e.key === 'Escape') setRenamingId(null);
                                            }}
                                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-2"
                                        />
                                        {renameError && <p className="text-red-500 text-xs mb-2 px-1">{renameError}</p>}
                                        <div className="flex gap-1.5">
                                            <button onClick={() => commitRename(ws.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-xs rounded-lg py-1.5 hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                                                <Check size={12} /> Save
                                            </button>
                                            <button onClick={() => setRenamingId(null)} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 hover:bg-slate-50 transition-colors shadow-sm font-medium">
                                                <X size={12} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setMenuOpenId(null); onSelectWorkspace(ws.id); }}
                                        className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all group ${isActive
                                            ? 'bg-indigo-50 text-indigo-900 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                            }`}
                                    >
                                        <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'}`}>
                                            <Bot size={14} />
                                        </div>
                                        <span className="flex-1 truncate">{ws.title}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === ws.id ? null : ws.id); }}
                                                className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                                            >
                                                <MoreHorizontal size={14} />
                                            </button>
                                        </div>
                                    </button>
                                )}

                                {/* Context Menu */}
                                {menuOpenId === ws.id && (
                                    <div className="absolute right-2 top-10 z-50 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-1.5 min-w-[140px]">
                                        <button
                                            onClick={() => startRename(ws)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors font-medium"
                                        >
                                            <Pencil size={14} /> Rename
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ws.id)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 text-xs font-medium text-slate-400 bg-slate-50/50">
                Developed by <span className="text-slate-500">Subal V R</span>
            </div>
        </aside>
    );
};

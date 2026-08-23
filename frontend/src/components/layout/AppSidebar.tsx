import { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2, Loader2, Bot } from 'lucide-react';
import { getWorkspaces, createWorkspace, deleteWorkspace } from '@/services/api';
import type { WorkspaceItem } from '@/types/api';

interface AppSidebarProps {
    activeWorkspaceId: string | null;
    onSelectWorkspace: (id: string) => void;
}

export const AppSidebar = ({ activeWorkspaceId, onSelectWorkspace }: AppSidebarProps) => {
    const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadWorkspaces = async () => {
        try {
            const data = await getWorkspaces();
            setWorkspaces(data);
            if (data.length > 0 && !activeWorkspaceId) {
                onSelectWorkspace(data[0].id);
            }
        } catch (e) {
            console.error("Failed to load workspaces", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const handleNewWorkspace = async () => {
        try {
            const newWs = await createWorkspace("New Meeting Chat");
            setWorkspaces([newWs, ...workspaces]);
            onSelectWorkspace(newWs.id);
        } catch (e) {
            console.error("Failed to create workspace", e);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this workspace and all its recordings?")) return;
        try {
            await deleteWorkspace(id);
            setWorkspaces(workspaces.filter(ws => ws.id !== id));
            if (activeWorkspaceId === id) {
                onSelectWorkspace(workspaces.find(ws => ws.id !== id)?.id || '');
            }
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    return (
        <div className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen border-r border-slate-800">
            {/* Header / New Chat */}
            <div className="p-4">
                <button
                    onClick={handleNewWorkspace}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-medium transition-colors"
                >
                    <Plus size={18} />
                    <span>New Workspace</span>
                </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                    Recent Workspaces
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-500" size={20} /></div>
                ) : workspaces.length === 0 ? (
                    <div className="text-center p-4 text-sm text-slate-500">No workspaces yet</div>
                ) : (
                    workspaces.map((ws) => (
                        <div
                            key={ws.id}
                            onClick={() => onSelectWorkspace(ws.id)}
                            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${activeWorkspaceId === ws.id
                                    ? 'bg-slate-800 text-white'
                                    : 'hover:bg-slate-800/50 hover:text-slate-100'
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare size={16} className={activeWorkspaceId === ws.id ? 'text-indigo-400' : 'text-slate-500'} />
                                <span className="truncate text-sm font-medium">{ws.title}</span>
                            </div>
                            <button
                                onClick={(e) => handleDelete(ws.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* User Profile / Branding */}
            <div className="p-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                    <Bot size={18} />
                </div>
                <div className="text-sm font-semibold text-white">Meeting AI</div>
            </div>
        </div>
    );
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { WorkspaceEmptyState } from '@/components/workspace/WorkspaceEmptyState';
import { RecordingList } from '@/components/workspace/RecordingList';
import { UploadRecordingButton } from '@/components/workspace/UploadRecordingButton';
import { WorkspaceChat } from '@/components/workspace/WorkspaceChat';
import { getRecordings } from '@/services/api';
import type { RecordingStatus } from '@/types/api';
import { Loader2 } from 'lucide-react';

export const WorkspacePage = () => {
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
        return localStorage.getItem('meetingmind_last_workspace_id');
    });
    const [recordings, setRecordings] = useState<RecordingStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const fetchRecordings = async (wsId: string) => {
        setIsLoading(true);
        try {
            const data = await getRecordings(wsId);
            setRecordings(data);
        } catch (e) {
            console.error("Failed to load recordings");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-poll recordings if there are any pending
    useEffect(() => {
        if (!activeWorkspaceId) return;
        fetchRecordings(activeWorkspaceId);

        const hasPending = recordings.some(r => ['pending', 'transcribing', 'analyzing'].includes(r.status));
        if (hasPending) {
            const interval = setInterval(() => fetchRecordings(activeWorkspaceId), 3000);
            return () => clearInterval(interval);
        }
    }, [activeWorkspaceId, recordings.map(r => r.status).join(',')]); // re-run if statuses change

    const handleWorkspaceSelect = (id: string) => {
        setActiveWorkspaceId(id);
        localStorage.setItem('meetingmind_last_workspace_id', id);
        fetchRecordings(id);
    };

    const handleUploadSuccess = () => {
        if (activeWorkspaceId) fetchRecordings(activeWorkspaceId);
    };

    return (
        <MainLayout activeWorkspaceId={activeWorkspaceId} onSelectWorkspace={handleWorkspaceSelect}>
            {!activeWorkspaceId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 animate-fade-in">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm text-center">
                        <h2 className="text-xl font-display font-semibold text-slate-900 mb-2">No workspaces yet</h2>
                        <p className="text-slate-500 text-sm">Create one to start organizing your meetings.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
                    {/* Header */}
                    <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 z-10">
                        <h1 className="font-display font-bold text-slate-900 text-xl tracking-tight">Workspace</h1>
                        <UploadRecordingButton workspaceId={activeWorkspaceId} onUploadSuccess={handleUploadSuccess} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        {isLoading && recordings.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            </div>
                        ) : recordings.length === 0 ? (
                            <WorkspaceEmptyState workspaceId={activeWorkspaceId} onUploadSuccess={handleUploadSuccess} />
                        ) : (
                            <div className="flex flex-col lg:flex-row h-full p-6 gap-6 overflow-y-auto w-full max-w-[1600px] mx-auto">
                                {/* Recordings List */}
                                <div className="flex-1 lg:w-3/5 flex flex-col min-w-0">
                                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Recordings</h2>
                                    <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex-1 min-h-0 overflow-y-auto">
                                        <RecordingList
                                            recordings={recordings}
                                            onSelectRecording={(id) => navigate(`/recording/${id}`)}
                                        />
                                    </div>
                                </div>

                                {/* Workspace Chat */}
                                <div className="flex-1 lg:w-2/5 h-[600px] lg:h-full pb-6 flex flex-col min-w-0">
                                    <div className="h-full bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden">
                                        <WorkspaceChat workspaceId={activeWorkspaceId} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

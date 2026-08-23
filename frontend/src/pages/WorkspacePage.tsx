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
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
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
        fetchRecordings(id);
    };

    const handleUploadSuccess = () => {
        if (activeWorkspaceId) fetchRecordings(activeWorkspaceId);
    };

    return (
        <MainLayout activeWorkspaceId={activeWorkspaceId} onSelectWorkspace={handleWorkspaceSelect}>
            {!activeWorkspaceId ? (
                <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
                    Select or create a workspace to begin.
                </div>
            ) : (
                <div className="flex flex-col h-full bg-slate-50">
                    {/* Header */}
                    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
                        <h1 className="font-bold text-slate-800 text-lg">Workspace</h1>
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
                            <div className="flex flex-col lg:flex-row h-full p-6 gap-6 overflow-y-auto">
                                {/* Recordings List */}
                                <div className="flex-1 lg:max-w-[60%]">
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Recordings</h2>
                                    <RecordingList
                                        recordings={recordings}
                                        onSelectRecording={(id) => navigate(`/recording/${id}`)}
                                    />
                                </div>

                                {/* Workspace Chat */}
                                <div className="flex-1 lg:max-w-[40%] h-[600px] lg:h-full pb-6">
                                    <div className="h-full shadow-lg rounded-2xl">
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

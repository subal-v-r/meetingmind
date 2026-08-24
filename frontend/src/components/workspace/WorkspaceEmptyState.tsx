import { UploadRecordingButton } from './UploadRecordingButton';
import { Mic } from 'lucide-react';

interface WorkspaceEmptyStateProps {
    workspaceId: string;
    onUploadSuccess: () => void;
}

export const WorkspaceEmptyState = ({ workspaceId, onUploadSuccess }: WorkspaceEmptyStateProps) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 h-full animate-fade-in bg-slate-50">
            <div className="text-center max-w-md bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-sm">
                    <Mic size={36} />
                </div>

                <h2 className="text-2xl font-display font-bold text-slate-900 mb-3 tracking-tight">
                    No recordings yet
                </h2>

                <p className="text-slate-500 mb-2 leading-relaxed text-sm">
                    Upload an audio or video recording to get started. Our AI will automatically extract transcripts, key decisions, and action items.
                </p>
                <p className="text-slate-400 mb-8 text-xs font-mono">
                    Supported: MP3, WAV, M4A, OGG, MP4, WebM, MOV
                </p>

                <div className="flex justify-center">
                    <UploadRecordingButton
                        workspaceId={workspaceId}
                        onUploadSuccess={onUploadSuccess}
                        size="lg"
                    />
                </div>
            </div>
        </div>
    );
};

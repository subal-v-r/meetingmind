import { UploadRecordingButton } from './UploadRecordingButton';

interface WorkspaceEmptyStateProps {
    workspaceId: string;
    onUploadSuccess: () => void;
}

export const WorkspaceEmptyState = ({ workspaceId, onUploadSuccess }: WorkspaceEmptyStateProps) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white h-full relative">

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center items-center opacity-[0.02]">
                <div className="w-[600px] h-[600px] rounded-full border-[60px] border-indigo-600"></div>
            </div>

            <div className="z-10 text-center max-w-md">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-3">Upload your first recording</h2>

                <p className="text-slate-500 mb-8 leading-relaxed">
                    Start by uploading an audio or video file. Our AI will transcribe, analyze, and extract key decisions and action items for you.
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

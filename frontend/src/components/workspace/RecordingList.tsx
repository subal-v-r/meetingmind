import { FileAudio, FileVideo, Clock, Loader2, PlayCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { RecordingStatus } from '@/types/api';
import { reprocessRecording } from '@/services/api';

interface RecordingListProps {
    recordings: RecordingStatus[];
    onSelectRecording: (id: string) => void;
}

const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const getFriendlyError = (errorMsg?: string | null): string => {
    if (!errorMsg) return 'An unexpected error occurred.';
    const msg = errorMsg.toLowerCase();
    if (msg.includes('api key') || msg.includes('authentication')) return 'API key issue. Check your Groq configuration.';
    if (msg.includes('rate limit') || msg.includes('rate_limit')) return 'API rate limit reached.';
    if (msg.includes('quota') || msg.includes('insufficient')) return 'API quota exceeded.';
    if (msg.includes('too large') || msg.includes('25 mb')) return 'File too large (max 25 MB).';
    if (msg.includes('unsupported format') || msg.includes('format')) return 'Unsupported file format.';
    if (msg.includes('not found')) return 'File not found on server.';
    if (msg.includes('network') || msg.includes('connection')) return 'Network error.';
    // Truncate long raw messages
    return errorMsg.length > 80 ? errorMsg.slice(0, 77) + '...' : errorMsg;
};

const RecordingCard = ({
    r,
    onSelectRecording,
}: { r: RecordingStatus; onSelectRecording: (id: string) => void }) => {
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRetrying(true);
        try {
            await reprocessRecording(r.id);
            // Poll will pick up status change
        } catch {
            // error from button click — state reverts after a moment
        } finally {
            setTimeout(() => setIsRetrying(false), 1500);
        }
    };

    return (
        <div
            onClick={() => r.status === 'ready' && onSelectRecording(r.id)}
            className={`bg-[#fdfaf0] border border-[#d6cead] rounded-2xl p-4 transition-all ${r.status === 'ready'
                    ? 'cursor-pointer hover:shadow-md hover:border-sage-400 group'
                    : 'opacity-90'
                }`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${r.file_type === 'video' ? 'bg-sage-100 text-sage-600' : 'bg-cream-200 text-sage-700'
                    }`}>
                    {r.file_type === 'video' ? <FileVideo size={22} /> : <FileAudio size={22} />}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-ink truncate mb-1 text-sm" title={r.filename}>
                        {r.filename}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-mist mb-3">
                        <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatDuration(r.duration_seconds)}
                        </span>
                        <span>•</span>
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Status Badge */}
                    {r.status === 'ready' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold">
                            <PlayCircle size={13} className="group-hover:scale-110 transition-transform" />
                            Ready to View
                        </div>
                    ) : r.status === 'failed' ? (
                        <div className="mt-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-2">
                                <AlertTriangle size={13} />
                                Processing Failed
                            </div>
                            <p className="text-xs text-mist leading-relaxed mb-2">
                                {getFriendlyError(r.error_message)}
                            </p>
                            <button
                                onClick={handleRetry}
                                disabled={isRetrying}
                                className="flex items-center gap-1.5 text-xs font-medium text-sage-700 hover:text-sage-900 bg-sage-100 hover:bg-sage-200 border border-sage-300 px-3 py-1 rounded-lg transition-colors disabled:opacity-60"
                            >
                                <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
                                {isRetrying ? 'Retrying...' : 'Retry'}
                            </button>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-200 text-ink text-xs font-semibold">
                            <Loader2 size={13} className="animate-spin" />
                            <span className="capitalize">{r.status}...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const RecordingList = ({ recordings, onSelectRecording }: RecordingListProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recordings.map(r => (
                <RecordingCard key={r.id} r={r} onSelectRecording={onSelectRecording} />
            ))}
        </div>
    );
};

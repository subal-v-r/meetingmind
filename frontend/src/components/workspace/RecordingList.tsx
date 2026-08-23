import { FileAudio, FileVideo, Clock, Loader2, PlayCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import type { RecordingStatus } from '@/types/api';

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

export const RecordingList = ({ recordings, onSelectRecording }: RecordingListProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map(r => (
                <div
                    key={r.id}
                    onClick={() => r.status === 'ready' && onSelectRecording(r.id)}
                    className={`card p-4 transition-all ${r.status === 'ready'
                            ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 group'
                            : 'opacity-80'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${r.file_type === 'video' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                            }`}>
                            {r.file_type === 'video' ? <FileVideo size={24} /> : <FileAudio size={24} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 truncate mb-1" title={r.filename}>
                                {r.filename}
                            </h4>

                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDuration(r.duration_seconds)}
                                </span>
                                <span>•</span>
                                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>

                            {/* Status Indicator */}
                            {r.status === 'ready' ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                    <PlayCircle size={14} className="group-hover:scale-110 transition-transform" />
                                    <span>Ready to View</span>
                                </div>
                            ) : r.status === 'failed' ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium" title={r.error_message || 'Failed'}>
                                    <AlertTriangle size={14} />
                                    <span>Failed</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span className="capitalize">{r.status}...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

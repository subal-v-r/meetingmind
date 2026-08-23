import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, MoreVertical } from 'lucide-react';
import { getRecording } from '@/services/api';
import { useRecordingPolling } from '@/hooks/useRecordingPolling';
import { useMediaSync } from '@/hooks/useMediaSync';
import { MediaPlayer } from '@/components/player/MediaPlayer';
import { LiveTranscript } from '@/components/transcript/LiveTranscript';
import { MeetingIntelligence } from '@/components/intelligence/MeetingIntelligence';

export const RecordingPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { recording, error, isPolling } = useRecordingPolling(id ?? null);

    // Fallback static fetch if polling is not active (though hook handles this)
    const segments = recording?.segments || null;

    const { playerRef, activeSegmentIndex, handleTimeUpdate, seekToSegment } = useMediaSync(segments);

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold">!</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load recording</h2>
                <p className="text-slate-500 max-w-md">{error}</p>
                <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors">
                    Back to Workspace
                </button>
            </div>
        );
    }

    if (!recording) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    // Is it still processing?
    const isProcessing = ['pending', 'transcribing', 'analyzing'].includes(recording.status);

    const mediaUrl = recording.file_path
        ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/uploads/${recording.file_path.split(/[\/\\]/).pop()}`
        : '';

    return (
        <div className="flex flex-col h-full bg-slate-100">
            {/* Top Navigation */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')} // Or navigate to specific workspace
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-slate-800 leading-tight">{recording.filename}</h2>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                            <span>{new Date(recording.created_at).toLocaleDateString()}</span>
                            {isProcessing && (
                                <>
                                    <span>•</span>
                                    <span className="text-indigo-600 flex items-center gap-1">
                                        <Loader2 size={10} className="animate-spin" /> Processing ({recording.status})
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row p-4 gap-4">

                {/* Left Side: Player + Transcript */}
                <div className="flex-1 flex flex-col min-w-0 flex-shrink gap-4 h-full">
                    {/* Media Player */}
                    {isProcessing ? (
                        <div className="w-full bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400 aspect-video shadow-lg">
                            <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                            <p className="font-medium text-white mb-2">Analyzing Media</p>
                            <p className="text-sm">Generating transcript and extracting intelligence...</p>
                        </div>
                    ) : mediaUrl ? (
                        <div className="flex-shrink-0 shadow-lg rounded-2xl overflow-hidden">
                            <MediaPlayer
                                ref={playerRef}
                                fileUrl={mediaUrl}
                                fileType={recording.file_type}
                                onTimeUpdate={handleTimeUpdate}
                            />
                        </div>
                    ) : (
                        <div className="w-full bg-slate-900 rounded-2xl p-8 flex items-center justify-center text-slate-400 h-32 shadow-lg">
                            Media file unavailable.
                        </div>
                    )}

                    {/* Live Transcript Panel */}
                    <div className="flex-1 min-h-0">
                        <LiveTranscript
                            segments={segments}
                            activeSegmentIndex={activeSegmentIndex}
                            onSegmentClick={seekToSegment}
                        />
                    </div>
                </div>

                {/* Right Side: Intelligence Panel */}
                <div className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 flex flex-col h-full bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
                    <MeetingIntelligence recording={recording} />
                </div>
            </div>
        </div>
    );
};

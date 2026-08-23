import { Search } from 'lucide-react';
import type { TranscriptSegment as ApiSegment } from '@/types/api';
import { TranscriptSegment } from './TranscriptSegment';
import { useState, useMemo } from 'react';

interface LiveTranscriptProps {
    segments: ApiSegment[] | null;
    activeSegmentIndex: number;
    onSegmentClick: (index: number) => void;
}

export const LiveTranscript = ({ segments, activeSegmentIndex, onSegmentClick }: LiveTranscriptProps) => {
    const [search, setSearch] = useState('');

    const filteredSegments = useMemo(() => {
        if (!segments) return [];
        if (!search.trim()) return segments;

        const q = search.toLowerCase();
        return segments.map((seg, originalIndex) => ({
            ...seg,
            originalIndex,
            matches: seg.text.toLowerCase().includes(q) || seg.speaker.toLowerCase().includes(q)
        }));
    }, [segments, search]);

    if (!segments || segments.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p>Transcript will appear here once processing is complete.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Search Bar */}
            <div className="p-3 border-b border-slate-200 bg-slate-50/50">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search transcript..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    />
                </div>
            </div>

            {/* Transcript Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {search.trim() ? (
                    // Search layout without auto-scroll constraints
                    filteredSegments.map(seg => {
                        if (!('matches' in seg) || !seg.matches) return null;
                        const idx = (seg as any).originalIndex;
                        return (
                            <TranscriptSegment
                                key={idx}
                                speaker={seg.speaker}
                                text={seg.text}
                                isActive={activeSegmentIndex === idx}
                                onClick={() => onSegmentClick(idx)}
                            />
                        );
                    })
                ) : (
                    // Standard live layout
                    segments.map((seg, idx) => (
                        <TranscriptSegment
                            key={idx}
                            speaker={seg.speaker}
                            text={seg.text}
                            isActive={activeSegmentIndex === idx}
                            onClick={() => onSegmentClick(idx)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

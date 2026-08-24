import { useRef, useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { TranscriptSegment as ApiSegment } from '@/types/api';

interface LiveTranscriptProps {
    segments: ApiSegment[] | null;
    activeSegmentIndex: number;
    onSegmentClick: (index: number) => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const LiveTranscript = ({ segments, activeSegmentIndex, onSegmentClick }: LiveTranscriptProps) => {
    const [search, setSearch] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);
    const [userScrolled, setUserScrolled] = useState(false);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-scroll to active segment during playback (unless user is manually scrolling)
    useEffect(() => {
        if (search.trim() || userScrolled) return;
        if (activeSegmentRef.current && scrollAreaRef.current) {
            activeSegmentRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeSegmentIndex, search, userScrolled]);

    const handleScroll = () => {
        setUserScrolled(true);
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => setUserScrolled(false), 4000);
    };

    const filteredSegments = useMemo(() => {
        if (!segments) return [];
        const q = search.toLowerCase().trim();
        if (!q) return segments.map((seg, idx) => ({ ...seg, originalIndex: idx }));
        return segments
            .map((seg, idx) => ({ ...seg, originalIndex: idx }))
            .filter(seg => seg.text.toLowerCase().includes(q) || seg.speaker.toLowerCase().includes(q));
    }, [segments, search]);

    if (!segments || segments.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm text-center p-6 bg-white border border-slate-200 rounded-xl">
                Transcript will appear here once processing is complete.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-200 flex-shrink-0 bg-slate-50/50">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search transcript..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    />
                </div>
            </div>

            <div ref={scrollAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0 bg-slate-50/30">
                {filteredSegments.map(seg => {
                    const isActive = activeSegmentIndex === seg.originalIndex;
                    return (
                        <div
                            key={seg.originalIndex}
                            ref={isActive && !search.trim() ? activeSegmentRef : null}
                            onClick={() => onSegmentClick(seg.originalIndex)}
                            className={`flex gap-2.5 p-2 rounded-lg cursor-pointer transition-colors group ${isActive
                                    ? 'bg-indigo-50 border border-indigo-100'
                                    : 'hover:bg-slate-100/60 border border-transparent'
                                }`}
                        >
                            <span className={`text-[10px] font-mono flex-shrink-0 mt-0.5 ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
                                {typeof seg.start === 'number' ? formatTime(seg.start) : '--:--'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                                    {seg.speaker}
                                </span>
                                <p className={`text-xs leading-relaxed ${isActive ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
                                    {seg.text}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

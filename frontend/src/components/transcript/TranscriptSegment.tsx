import { useEffect, useRef } from 'react';

interface SegmentProps {
    text: string;
    speaker: string;
    isActive: boolean;
    onClick: () => void;
}

export const TranscriptSegment = ({ text, speaker, isActive, onClick }: SegmentProps) => {
    const elRef = useRef<HTMLDivElement>(null);

    // Auto-scroll into view when it becomes active
    useEffect(() => {
        if (isActive && elRef.current) {
            elRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [isActive]);

    return (
        <div
            ref={elRef}
            onClick={onClick}
            className={`p-3 rounded-xl cursor-pointer transition-colors duration-300 ${isActive
                    ? 'bg-indigo-50 border border-indigo-100 shadow-sm'
                    : 'hover:bg-slate-100 border border-transparent'
                }`}
        >
            <div className={`text-xs font-semibold mb-1 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                {speaker}
            </div>
            <div className={`leading-relaxed ${isActive ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
                {text}
            </div>
        </div>
    );
};

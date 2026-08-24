import { FileText, MousePointer2 } from 'lucide-react';

interface SummaryPanelProps {
    summary: string | null;
    keyPoints: string[] | null;
}

export const SummaryPanel = ({ summary, keyPoints }: SummaryPanelProps) => {
    if (!summary && (!keyPoints || keyPoints.length === 0)) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <FileText size={32} className="mb-3 opacity-50" />
                <p>No summary available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Executive Summary</h3>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                    {summary}
                </p>
            </section>

            {keyPoints && keyPoints.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Key Highlights</h3>
                    <ul className="space-y-3">
                        {keyPoints.map((point, i) => (
                            <li key={i} className="flex gap-3 text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                                <div className="mt-0.5 text-indigo-400">
                                    <MousePointer2 size={16} className="rotate-90" />
                                </div>
                                <span className="leading-relaxed text-sm">{point}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

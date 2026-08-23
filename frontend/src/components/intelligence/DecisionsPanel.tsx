import { CheckSquare, Check } from 'lucide-react';

interface DecisionsPanelProps {
    decisions: string[] | null;
}

export const DecisionsPanel = ({ decisions }: DecisionsPanelProps) => {
    if (!decisions || decisions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckSquare size={32} className="mb-3 opacity-50" />
                <p>No major decisions detected in this meeting.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Decisions Made</h3>
            <div className="grid gap-3">
                {decisions.map((decision, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl hover:border-emerald-200 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Check size={16} />
                        </div>
                        <div className="flex-1 mt-1 text-slate-800 font-medium text-sm leading-relaxed">
                            {decision}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

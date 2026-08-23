import { ListTodo, User } from 'lucide-react';
import type { ActionItem } from '@/types/api';

interface ActionItemsPanelProps {
    actionItems: ActionItem[] | null;
}

export const ActionItemsPanel = ({ actionItems }: ActionItemsPanelProps) => {
    if (!actionItems || actionItems.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ListTodo size={32} className="mb-3 opacity-50" />
                <p>No action items detected.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Action Items</h3>
            <div className="grid gap-3">
                {actionItems.map((item, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow transition-all group">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <p className="text-slate-800 font-medium text-sm leading-relaxed">{item.task}</p>
                            <span className="shrink-0 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200/50">
                                {item.status || 'Pending'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg">
                                <User size={14} />
                                <span>{item.assignee}</span>
                            </div>

                            {item.deadline && (
                                <div className="text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                    Due: {item.deadline}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

import { useState } from 'react';
import { Sparkles, CheckSquare, ListTodo, FileText } from 'lucide-react';
import type { RecordingDetail } from '@/types/api';

import { SummaryPanel } from './SummaryPanel';
import { DecisionsPanel } from './DecisionsPanel';
import { ActionItemsPanel } from './ActionItemsPanel';
import { GenerateMomButton } from './GenerateMomButton';
import { MomModal } from './MomModal';

type Tab = 'Summary' | 'Decisions' | 'Action Items';

interface MeetingIntelligenceProps {
    recording: RecordingDetail;
}

export const MeetingIntelligence = ({ recording }: MeetingIntelligenceProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('Summary');
    const [isMomModalOpen, setIsMomModalOpen] = useState(false);

    return (
        <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    <Sparkles size={18} />
                    <span>Meeting Intelligence</span>
                </div>
                <GenerateMomButton onClick={() => setIsMomModalOpen(true)} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
                {(['Summary', 'Decisions', 'Action Items'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {tab === 'Summary' && <FileText size={16} />}
                            {tab === 'Decisions' && <CheckSquare size={16} />}
                            {tab === 'Action Items' && <ListTodo size={16} />}
                            {tab}
                        </div>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
                {activeTab === 'Summary' && <SummaryPanel summary={recording.summary} keyPoints={recording.key_points} />}
                {activeTab === 'Decisions' && <DecisionsPanel decisions={recording.decisions} />}
                {activeTab === 'Action Items' && <ActionItemsPanel actionItems={recording.action_items} />}
            </div>

            {/* Modals */}
            {isMomModalOpen && (
                <MomModal
                    recordingId={recording.id}
                    workspaceId={null}
                    onClose={() => setIsMomModalOpen(false)}
                />
            )}
        </div>
    );
};

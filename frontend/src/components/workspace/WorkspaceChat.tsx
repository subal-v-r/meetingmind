import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { sendChatMessage, getChatMessages, getErrorMessage } from '@/services/api';
import type { ChatMessage as APIChatMessage } from '@/types/api';
import { ChatMessage } from './ChatMessage';

interface WorkspaceChatProps {
    workspaceId: string;
}

export const WorkspaceChat = ({ workspaceId }: WorkspaceChatProps) => {
    const [messages, setMessages] = useState<APIChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            setIsFetching(true);
            try {
                const data = await getChatMessages(workspaceId);
                setMessages(data);
            } catch (e) {
                console.error("Failed to load history", e);
            } finally {
                setIsFetching(false);
            }
        };
        fetchMessages();
    }, [workspaceId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || isLoading) return;

        setInput('');

        // Optimistic UI for user message
        const tempMsg: APIChatMessage = {
            id: Date.now().toString(),
            workspace_id: workspaceId,
            role: 'user',
            content: text,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setIsLoading(true);

        try {
            const aiMsg = await sendChatMessage(workspaceId, text);
            // Replace with actual data fetch for safety, or just append AI reply
            const updated = await getChatMessages(workspaceId);
            setMessages(updated);
        } catch (err) {
            console.error("Chat error", getErrorMessage(err));
            // Rollback optimistic
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Meeting Assistant</h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">GPT-4o-mini</span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isFetching ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                            <span className="text-xl">👋</span>
                        </div>
                        <p className="font-medium text-slate-600 mb-1">How can I help?</p>
                        <p className="text-sm">Ask questions across all recordings in this workspace.</p>
                    </div>
                ) : (
                    messages.map(m => <ChatMessage key={m.id} role={m.role} content={m.content} />)
                )}

                {isLoading && (
                    <div className="flex items-center gap-2 p-4 text-slate-400 text-sm">
                        <Loader2 className="animate-spin" size={16} /> Assistant is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about these meetings..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};

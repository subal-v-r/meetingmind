import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
    const isUser = role === 'user';

    return (
        <div className={`flex gap-4 p-4 ${isUser ? '' : 'bg-white rounded-xl shadow-sm border border-slate-100'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm'
                }`}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className="flex-1 text-slate-800 leading-relaxed max-w-[85ch]">
                {content
                    .replace(/\*\*/g, '')
                    .replace(/__/g, '')
                    .replace(/###?\s/g, '')
                    .replace(/\|/g, '')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .split('\n')
                    .map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0 min-h-[1rem] whitespace-pre-wrap">
                            {line.trim()}
                        </p>
                    ))}
            </div>
        </div>
    );
};

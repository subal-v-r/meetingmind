import { Mic, Sparkles, Brain, CheckSquare, ListTodo, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

export const HomePage = () => {
    const navigate = useNavigate();
    const workflowRef = useRef<HTMLDivElement>(null);

    const scrollToWorkflow = () => {
        workflowRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="bg-white min-h-screen flex flex-col text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 border-l border-slate-200">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[10px] bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30 text-white">
                        <Mic size={16} strokeWidth={2.5} />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight text-slate-900">MeetingMind</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-600/30 active:scale-[0.98] flex items-center gap-2"
                    >
                        Go to Workspace <ArrowRight size={16} />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 max-w-6xl mx-auto px-8 py-20 text-center animate-slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8">
                    <Sparkles size={16} /> AI-powered meeting intelligence
                </div>

                <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                    Never take meeting <br /> notes again.
                </h1>

                <p className="text-lg text-slate-500 mb-10 max-w-3xl mx-auto leading-relaxed">
                    Upload your meeting recordings and let MeetingMind transcribe conversations, summarize discussions, identify key decisions, and track action items automatically.
                </p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => navigate('/app')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                        Start Working &rarr;
                    </button>
                    <button
                        onClick={scrollToWorkflow}
                        className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-sm active:scale-[0.98]"
                    >
                        How It Works
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mt-24 text-left">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 border border-indigo-100">
                            <Brain size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Summaries</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Get a concise overview of your meeting without replaying the entire recording.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
                            <CheckSquare size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Key Decisions</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Automatically identify important decisions and agreements from the conversation.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-5 border border-green-100">
                            <ListTodo size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Action Items</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Extract tasks, assignees, and deadlines so important follow-ups don't get missed.
                        </p>
                    </div>
                </div>

                {/* How It Works Section */}
                <div ref={workflowRef} className="mt-32 mb-20 text-left bg-slate-50 p-10 rounded-[40px] border border-slate-200 w-full animate-fade-in shadow-sm">
                    <h2 className="text-3xl font-display font-bold text-slate-900 mt-2 mb-12 text-center tracking-tight">How MeetingMind Works</h2>

                    <div className="flex flex-col md:flex-row justify-between relative gap-8">
                        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 z-10 relative">
                            <span className="inline-block text-sm font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg mb-4">01</span>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">Create a Workspace</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Keep related meetings and recordings organized.</p>
                        </div>

                        <div className="hidden md:flex absolute top-1/2 left-0 w-full h-px border-t-2 border-dashed border-slate-200 -z-0"></div>

                        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 z-10 relative">
                            <span className="inline-block text-sm font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg mb-4">02</span>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">Upload Your Recording</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Upload an audio or video file from your meeting.</p>
                        </div>

                        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 z-10 relative">
                            <span className="inline-block text-sm font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg mb-4">03</span>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">Let AI Analyze It</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">MeetingMind creates a transcript and identifies important information.</p>
                        </div>

                        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 z-10 relative">
                            <span className="inline-block text-sm font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg mb-4">04</span>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">Review What Matters</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">View summaries, decisions, and actionable tasks in one place.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-slate-50 py-10 border-t border-slate-200 text-center">
                <p className="font-display font-bold text-slate-900 mb-1">MeetingMind</p>
                <p className="text-xs text-slate-500 mb-4">AI-powered meeting intelligence.<br />Built to help you focus on conversations instead of taking notes.</p>
                <p className="text-[10px] text-slate-400 font-medium">© 2026 MeetingMind | Developed by Subal V R</p>
            </footer>
        </div>
    );
};

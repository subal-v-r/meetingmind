import { Mic, Sparkles, Brain, CheckSquare, ListTodo, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 border-l border-slate-200">
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
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/app')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-600/30 active:scale-[0.98] flex items-center gap-2"
                    >
                        Go to Workspace <ArrowRight size={16} />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-6xl mx-auto px-8 py-20 text-center animate-slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8">
                    <Sparkles size={16} /> Meet the new AI Meeting Assistant
                </div>

                <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                    Never take meeting <br /> notes again.
                </h1>

                <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Upload your audio or video recordings. Our AI automatically transcribes, summarizes, and extracts key decisions and action items in seconds.
                </p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => navigate('/app')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                        Start for Free
                    </button>
                    <button
                        onClick={() => navigate('/app')}
                        className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-sm active:scale-[0.98]"
                    >
                        View Demo
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
                            Get instant, highly accurate AI summaries of any lengthy meeting, saving you hours of playback time.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
                            <CheckSquare size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Key Decisions</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Automatically capture all decisions agreed upon by the team, avoiding confusion inside long transcripts.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-5 border border-green-100">
                            <ListTodo size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Action Items tracking</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Never drop the ball. We automatically extract and assign action items with deadlines from your conversations.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

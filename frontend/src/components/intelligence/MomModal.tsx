import { useState, useEffect } from 'react';
import { X, Loader2, Download, Copy, CheckCircle2 } from 'lucide-react';
import { generateRecordingMom, generateWorkspaceMom, getErrorMessage } from '@/services/api';

interface MomModalProps {
    recordingId: string | null;
    workspaceId: string | null;
    onClose: () => void;
}

export const MomModal = ({ recordingId, workspaceId, onClose }: MomModalProps) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const generate = async () => {
            try {
                const res = recordingId
                    ? await generateRecordingMom(recordingId)
                    : await generateWorkspaceMom(workspaceId!);
                setContent(res.content);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setIsLoading(false);
            }
        };
        generate();
    }, [recordingId, workspaceId]);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MOM_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">Minutes of Meeting (MOM)</h2>
                    <div className="flex items-center gap-2">
                        {!isLoading && !error && (
                            <>
                                <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                                    {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                                <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                                    <Download size={16} /> Download .md
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-2">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Loader2 size={40} className="animate-spin mb-4 text-indigo-600" />
                            <p className="font-medium text-lg text-slate-800">Generating Document...</p>
                            <p className="text-sm mt-1">Our AI is formatting the perfect MOM.</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 text-center max-w-md mx-auto">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <X size={32} />
                            </div>
                            <p className="font-medium">{error}</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-h-full">
                            <pre className="font-sans whitespace-pre-wrap text-slate-800 leading-relaxed text-sm">
                                {content}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

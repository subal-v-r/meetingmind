import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { uploadRecording, getErrorMessage } from '@/services/api';

interface UploadRecordingButtonProps {
    workspaceId: string;
    onUploadSuccess: () => void;
    size?: 'sm' | 'lg';
}

export const UploadRecordingButton = ({ workspaceId, onUploadSuccess, size = 'sm' }: UploadRecordingButtonProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);
        try {
            await uploadRecording(workspaceId, file);
            if (inputRef.current) inputRef.current.value = '';
            onUploadSuccess();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsUploading(false);
        }
    };

    const isLg = size === 'lg';

    return (
        <div className="flex flex-col items-center">
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="audio/*,video/*"
            />

            <button
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className={`
                    flex items-center justify-center gap-2 font-medium transition-all
                    ${isLg
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl text-lg shadow-sm hover:shadow-md'
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2 px-4 rounded-lg shadow-sm'
                    }
                    ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                {isUploading ? (
                    <><Loader2 className="animate-spin" size={isLg ? 20 : 18} /> Uploading...</>
                ) : (
                    <><Upload size={isLg ? 20 : 18} /> Upload Recording</>
                )}
            </button>

            {error && <div className="text-red-500 text-sm mt-2 font-medium">{error}</div>}
        </div>
    );
};

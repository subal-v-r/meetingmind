import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { uploadRecording, getErrorMessage } from '@/services/api';

interface UploadRecordingButtonProps {
    workspaceId: string;
    onUploadSuccess: () => void;
    size?: 'sm' | 'lg';
}

// All formats accepted by Groq Whisper + common video containers
const ACCEPTED_FORMATS = '.mp3,.wav,.m4a,.flac,.ogg,.mpeg,.mpga,.mp4,.webm,.mov,.avi';

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
                accept={ACCEPTED_FORMATS}
            />

            <button
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className={`
                    flex items-center justify-center gap-2 font-medium transition-colors
                    ${isLg
                        ? 'bg-sage-600 hover:bg-sage-700 text-white py-3 px-6 rounded-xl text-base shadow-sm'
                        : 'bg-[#fdfaf0] hover:bg-cream-200 border border-[#c9c0a0] text-ink py-2 px-4 rounded-lg shadow-sm text-sm'
                    }
                    ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                {isUploading ? (
                    <><Loader2 className="animate-spin" size={isLg ? 20 : 16} /> Uploading...</>
                ) : (
                    <><Upload size={isLg ? 20 : 16} /> Upload Audio / Video</>
                )}
            </button>

            {error && (
                <div className="text-red-600 text-sm mt-2 font-medium max-w-xs text-center">{error}</div>
            )}
        </div>
    );
};

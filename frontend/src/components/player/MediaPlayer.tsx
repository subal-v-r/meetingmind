import { forwardRef } from 'react';

interface MediaPlayerProps {
    fileUrl: string;
    fileType: 'audio' | 'video' | null;
    onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) => void;
}

export const MediaPlayer = forwardRef<HTMLMediaElement, MediaPlayerProps>(
    ({ fileUrl, fileType, onTimeUpdate }, ref) => {
        const isVideo = fileType === 'video';

        return (
            <div className={`w-full bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-center ${isVideo ? 'aspect-video' : 'p-6 h-32'}`}>
                {isVideo ? (
                    <video
                        ref={ref as React.RefObject<HTMLVideoElement>}
                        src={fileUrl}
                        controls
                        controlsList="nodownload"
                        className="w-full h-full outline-none"
                        onTimeUpdate={onTimeUpdate}
                    />
                ) : (
                    <audio
                        ref={ref as React.RefObject<HTMLAudioElement>}
                        src={fileUrl}
                        controls
                        controlsList="nodownload"
                        className="w-full outline-none"
                        onTimeUpdate={onTimeUpdate}
                    />
                )}
            </div>
        );
    }
);

MediaPlayer.displayName = 'MediaPlayer';

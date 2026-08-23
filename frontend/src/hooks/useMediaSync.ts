/**
 * Hook to synchronize a video/audio player's current time with a transcript segment.
 */
import { useState, useCallback, useRef } from 'react';
import type { TranscriptSegment } from '@/types/api';

export const useMediaSync = (segments: TranscriptSegment[] | null) => {
    const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
    const [currentTime, setCurrentTime] = useState(0);
    const playerRef = useRef<HTMLMediaElement | null>(null);

    // Called on timeupdate event from the media element
    const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
        const time = e.currentTarget.currentTime;
        setCurrentTime(time);

        if (!segments || segments.length === 0) return;

        // Find the segment spanning the current time
        // If not strictly inside one, find the closest one that we just passed or are currently inside.
        // A simple approach: find the last segment where start <= time
        let activeIdx = -1;
        for (let i = 0; i < segments.length; i++) {
            if (time >= segments[i].start) {
                // Keep updating activeIdx to the latest one that has started
                activeIdx = i;
            } else {
                // Because segments are sorted by start time, we can break early
                break;
            }
        }

        if (activeIdx !== activeSegmentIndex) {
            setActiveSegmentIndex(activeIdx);
        }
    }, [segments, activeSegmentIndex]);

    const seekToSegment = useCallback((index: number) => {
        if (!segments?.[index] || !playerRef.current) return;
        const time = segments[index].start;
        playerRef.current.currentTime = time;
        playerRef.current.play().catch(() => { }); // Attempt to auto-play on seek
    }, [segments]);

    return {
        playerRef,
        currentTime,
        activeSegmentIndex,
        handleTimeUpdate,
        seekToSegment,
    };
};

/**
 * Polling hook — polls GET /api/recordings/{id} every 2s until done.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { getRecording, getErrorMessage } from '@/services/api';
import type { RecordingDetail } from '@/types/api';

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES = new Set(['ready', 'failed']);

export const useRecordingPolling = (recordingId: string | null) => {
    const [recording, setRecording] = useState<RecordingDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPolling(false);
    }, []);

    const fetchRecording = useCallback(async (id: string) => {
        try {
            const data = await getRecording(id);
            setRecording(data);
            if (TERMINAL_STATUSES.has(data.status)) {
                stopPolling();
            }
        } catch (err) {
            setError(getErrorMessage(err));
            stopPolling();
        }
    }, [stopPolling]);

    useEffect(() => {
        if (!recordingId) {
            setRecording(null);
            setError(null);
            return;
        }

        setIsPolling(true);
        setError(null);

        // Fetch immediately, then poll
        fetchRecording(recordingId);
        intervalRef.current = setInterval(() => fetchRecording(recordingId), POLL_INTERVAL_MS);

        return stopPolling;
    }, [recordingId, fetchRecording, stopPolling]);

    return { recording, error, isPolling };
};

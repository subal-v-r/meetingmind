/**
 * Centralized API service for all backend calls.
 */

import axios from 'axios';
import * as T from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 120_000,
});

// ─── Workspaces ──────────────────────────────────────────────────────────────

export const createWorkspace = async (title: string = "New Meeting Chat") => {
    const { data } = await api.post<T.WorkspaceItem>('/api/workspaces', { title });
    return data;
};

export const getWorkspaces = async () => {
    const { data } = await api.get<T.WorkspaceItem[]>('/api/workspaces');
    return data;
};

export const getWorkspace = async (id: string) => {
    const { data } = await api.get<T.WorkspaceItem>(`/api/workspaces/${id}`);
    return data;
};

export const renameWorkspace = async (id: string, title: string) => {
    const { data } = await api.patch<T.WorkspaceItem>(`/api/workspaces/${id}`, { title });
    return data;
};

export const deleteWorkspace = async (id: string) => {
    await api.delete(`/api/workspaces/${id}`);
};

// ─── Recordings ──────────────────────────────────────────────────────────────

export const uploadRecording = async (workspaceId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<T.UploadResponse>(
        `/api/workspaces/${workspaceId}/recordings/upload`,
        formData
    );
    return data;
};

export const getRecordings = async (workspaceId: string) => {
    const { data } = await api.get<T.RecordingStatus[]>(`/api/workspaces/${workspaceId}/recordings`);
    return data;
};

export const getRecording = async (id: string) => {
    const { data } = await api.get<T.RecordingDetail>(`/api/recordings/${id}`);
    return data;
};

export const getTranscript = async (id: string) => {
    const { data } = await api.get<T.TranscriptResponse>(`/api/recordings/${id}/transcript`);
    return data;
};

export const deleteRecording = async (id: string) => {
    await api.delete(`/api/recordings/${id}`);
};

export const reprocessRecording = async (id: string) => {
    const { data } = await api.post<T.UploadResponse>(`/api/recordings/${id}/reprocess`);
    return data;
};

export const updateActionItems = async (
    recordingId: string,
    actionItems: { task: string; assignee: string; deadline?: string | null; status: string }[]
) => {
    const { data } = await api.patch<T.RecordingDetail>(
        `/api/recordings/${recordingId}/action-items`,
        { action_items: actionItems }
    );
    return data;
};


// ─── Chat ────────────────────────────────────────────────────────────────────

export const sendChatMessage = async (workspaceId: string, message: string) => {
    const { data } = await api.post<T.ChatMessage>(`/api/workspaces/${workspaceId}/chat`, { message });
    return data;
};

export const getChatMessages = async (workspaceId: string) => {
    const { data } = await api.get<T.ChatMessage[]>(`/api/workspaces/${workspaceId}/messages`);
    return data;
};

// ─── MOM (Minutes of Meeting) ────────────────────────────────────────────────

export const generateRecordingMom = async (id: string) => {
    const { data } = await api.post<T.MomResponse>(`/api/recordings/${id}/generate-mom`);
    return data;
};

export const generateWorkspaceMom = async (workspaceId: string) => {
    const { data } = await api.post<T.MomResponse>(`/api/workspaces/${workspaceId}/generate-mom`);
    return data;
};

// ─── Utils ───────────────────────────────────────────────────────────────────

export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.detail ?? error.message ?? 'An unknown error occurred.';
    }
    if (error instanceof Error) return error.message;
    return 'An unknown error occurred.';
};

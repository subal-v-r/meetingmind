/**
 * TypeScript interfaces mirroring the backend Pydantic schemas.
 */

export interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
    speaker: string;
}

export interface ActionItem {
    task: string;
    assignee: string;
    deadline: string | null;
    status: 'Pending';
}

export interface WorkspaceItem {
    id: string;
    title: string;
    recording_count: number;
    created_at: string;
    updated_at: string;
}

export interface RecordingStatus {
    id: string;
    workspace_id: string;
    filename: string;
    file_type: 'audio' | 'video' | null;
    file_path: string | null;
    status: 'pending' | 'transcribing' | 'analyzing' | 'ready' | 'failed';
    error_message: string | null;
    duration_seconds: number | null;
    created_at: string;
    updated_at: string;
}

export interface RecordingDetail extends RecordingStatus {
    transcript: string | null;
    segments: TranscriptSegment[] | null;
    summary: string | null;
    key_points: string[] | null;
    decisions: string[] | null;
    action_items: ActionItem[] | null;
}

export interface TranscriptResponse {
    recording_id: string;
    filename: string;
    full_text: string | null;
    segments: TranscriptSegment[] | null;
    status: string;
}

export interface UploadResponse {
    recording_id: string;
    workspace_id: string;
    message: string;
    status: string;
}

export interface ChatMessage {
    id: string;
    workspace_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface MomResponse {
    recording_id: string | null;
    workspace_id: string | null;
    title: string;
    content: string;
}

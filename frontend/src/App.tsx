import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspacePage } from './pages/WorkspacePage';
import { RecordingPage } from './pages/RecordingPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WorkspacePage />} />
                <Route path="/recording/:id" element={<RecordingPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

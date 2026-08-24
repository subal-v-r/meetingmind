import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface MainLayoutProps {
    children: ReactNode;
    activeWorkspaceId: string | null;
    onSelectWorkspace: (id: string) => void;
}

export const MainLayout = ({ children, activeWorkspaceId, onSelectWorkspace }: MainLayoutProps) => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
            {/* Left Sidebar */}
            <AppSidebar
                activeWorkspaceId={activeWorkspaceId}
                onSelectWorkspace={onSelectWorkspace}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {children}
            </main>
        </div>
    );
};

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export interface DashboardLayoutProps {
    title: string;
    subtitle: string;
    userEmail?: string | null;
    onLogout: () => void;
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    title,
    subtitle,
    userEmail,
    onLogout,
    children
}) => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
            {/* Sidebar */}
            <Sidebar
                onLogout={onLogout}
                isOpen={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    title={title}
                    subtitle={subtitle}
                    userEmail={userEmail}
                    onMenuToggle={() => setMobileSidebarOpen(true)}
                />

                <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

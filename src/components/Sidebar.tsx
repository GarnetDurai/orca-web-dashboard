import React from "react";

export interface SidebarProps {
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    activeTab?: "overview" | "performance" | "confidence" | "revision";
    onSelectTab?: (tab: "overview" | "performance" | "confidence" | "revision") => void;
}

interface NavItemDef {
    id: "overview" | "performance" | "confidence" | "revision" | "problems";
    label: string;
    isPlaceholder: boolean;
}

const NAV_ITEM_DEFS: NavItemDef[] = [
    { id: "overview", label: "Overview", isPlaceholder: false },
    { id: "performance", label: "Performance", isPlaceholder: false },
    { id: "confidence", label: "Confidence", isPlaceholder: false },
    { id: "revision", label: "Revision", isPlaceholder: false },
    { id: "problems", label: "Problems", isPlaceholder: true }
];

export const Sidebar: React.FC<SidebarProps> = ({
    onLogout,
    isOpen = false,
    onClose,
    activeTab = "overview",
    onSelectTab
}) => {
    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed md:sticky top-0 left-0 z-50 h-screen w-60 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Brand & Nav */}
                <div className="p-5">
                    {/* Brand */}
                    <div className="flex items-center justify-between pb-6 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" />
                            <span className="font-mono text-sm font-bold tracking-widest text-slate-900 dark:text-slate-100">
                                ORCA
                            </span>
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                aria-label="Close sidebar"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1 mt-4" aria-label="Main Navigation">
                        {NAV_ITEM_DEFS.map((item) => {
                            if (item.isPlaceholder) {
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 dark:text-slate-600 rounded-md cursor-not-allowed select-none"
                                        title={`${item.label} (Upcoming phase)`}
                                    >
                                        <span>{item.label}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-mono opacity-50">
                                            Soon
                                        </span>
                                    </div>
                                );
                            }

                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectTab?.(item.id as "overview" | "performance" | "confidence" | "revision");
                                        onClose?.();
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-left ${
                                        isActive
                                            ? "bg-slate-100 dark:bg-slate-800/80 text-sky-600 dark:text-sky-400 font-semibold"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer / Logout */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-colors cursor-pointer"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

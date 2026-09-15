import React from "react";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderProps {
    title: string;
    subtitle: string;
    userEmail?: string | null;
    onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    userEmail,
    onMenuToggle
}) => {
    return (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="px-6 py-4 flex items-center justify-between">
                {/* Left: Mobile Toggle & Page Title */}
                <div className="flex items-center gap-3">
                    {onMenuToggle && (
                        <button
                            type="button"
                            onClick={onMenuToggle}
                            className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-800 cursor-pointer"
                            aria-label="Open sidebar navigation"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="4" x2="20" y1="12" y2="12" />
                                <line x1="4" x2="20" y1="6" y2="6" />
                                <line x1="4" x2="20" y1="18" y2="18" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                            {title}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Right: Theme Toggle & User Area */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {userEmail && (
                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs">
                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-medium text-[11px] text-slate-700 dark:text-slate-300">
                                {userEmail.charAt(0).toUpperCase()}
                            </span>
                            <span className="hidden sm:inline font-mono text-slate-600 dark:text-slate-400 max-w-[160px] truncate">
                                {userEmail}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

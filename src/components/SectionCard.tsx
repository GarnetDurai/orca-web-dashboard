import React from "react";

export interface SectionCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    subtitle,
    children,
    className = ""
}) => {
    return (
        <div
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 transition-colors ${className}`}
        >
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
};

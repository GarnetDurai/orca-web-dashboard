import React from "react";

export interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    tone?: "neutral" | "success" | "warning" | "danger";
    size?: "default" | "compact";
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    subtext,
    tone = "neutral",
    size = "default"
}) => {
    const toneStyles = {
        neutral: "text-slate-900 dark:text-slate-100",
        success: "text-emerald-600 dark:text-emerald-400",
        warning: "text-amber-600 dark:text-amber-400",
        danger: "text-rose-600 dark:text-rose-400"
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 transition-colors">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {label}
            </div>
            <div
                className={`font-semibold tracking-tight ${toneStyles[tone]} ${
                    size === "compact" ? "text-xl" : "text-2xl"
                }`}
            >
                {value}
            </div>
            {subtext && (
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {subtext}
                </div>
            )}
        </div>
    );
};

import React from "react";

export const LoadingState: React.FC = () => {
    return (
        <div data-testid="loading-state" className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Loading overview analytics...
            </p>
        </div>
    );
};

export interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
    return (
        <div
            data-testid="error-state"
            className="p-4 border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg text-rose-800 dark:text-rose-300"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        Error Loading Data
                    </h3>
                    <p className="text-xs mt-1">{message}</p>
                </div>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="px-3 py-1.5 text-xs font-medium bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 hover:bg-rose-200 dark:hover:bg-rose-800/60 rounded transition-colors cursor-pointer"
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
};

export interface EmptyStateProps {
    title?: string;
    description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = "No Practice Data Yet",
    description = "Complete practice sessions on LeetCode with the ORCA Chrome Extension to populate your DSA overview."
}) => {
    return (
        <div
            data-testid="empty-state"
            className="py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-900/30"
        >
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {description}
            </p>
        </div>
    );
};

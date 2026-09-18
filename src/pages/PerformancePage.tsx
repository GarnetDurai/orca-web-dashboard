import React, { useEffect, useState, useCallback } from "react";
import { AnalyticsApiService } from "../services/analyticsApiService";
import { StatCard } from "../components/StatCard";
import { SectionCard } from "../components/SectionCard";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { formatDuration, formatRate, formatDecimal } from "../utils/formatters";
import type { HistoricalAnalytics, TimeWindow } from "../types/analytics";

export interface PerformancePageProps {
    token: string;
}

const TIME_WINDOWS: { value: TimeWindow; label: string }[] = [
    { value: "ALL_TIME", label: "All Time" },
    { value: "LAST_7_DAYS", label: "Last 7 Days" },
    { value: "LAST_30_DAYS", label: "Last 30 Days" },
    { value: "LAST_90_DAYS", label: "Last 90 Days" }
];

export const PerformancePage: React.FC<PerformancePageProps> = ({ token }) => {
    const [timeWindow, setTimeWindow] = useState<TimeWindow>("ALL_TIME");
    const [analytics, setAnalytics] = useState<HistoricalAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await AnalyticsApiService.getHistoricalAnalytics(token, timeWindow);
            setAnalytics(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load performance analytics.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [token, timeWindow]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const difficulties: { key: string; label: string; dotClass: string }[] = [
        { key: "EASY", label: "Easy", dotClass: "bg-emerald-500" },
        { key: "MEDIUM", label: "Medium", dotClass: "bg-amber-500" },
        { key: "HARD", label: "Hard", dotClass: "bg-rose-500" }
    ];

    // Extract and sort top topics by problems solved descending (limit to 10)
    const topicList = analytics?.topicAnalytics
        ? Object.entries(analytics.topicAnalytics)
              .map(([topic, data]) => ({ topic, ...data }))
              .sort((a, b) => (b.problemsSolved ?? 0) - (a.problemsSolved ?? 0))
              .slice(0, 10)
        : [];

    const isEmpty =
        !analytics ||
        ((analytics.totalSessions ?? 0) === 0 && (analytics.totalProblemsSolved ?? 0) === 0);

    return (
        <div className="space-y-6">
            {/* Controls Bar: Time Window Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Historical Time Window
                </span>
                <div
                    className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100/60 dark:bg-slate-900/60"
                    role="group"
                    aria-label="Time Window Selector"
                >
                    {TIME_WINDOWS.map((windowOption) => {
                        const isSelected = timeWindow === windowOption.value;
                        return (
                            <button
                                key={windowOption.value}
                                type="button"
                                onClick={() => setTimeWindow(windowOption.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                    isSelected
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                }`}
                            >
                                {windowOption.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && <LoadingState message="Loading performance analytics..." />}

            {/* Error State */}
            {!isLoading && error && <ErrorState message={error} onRetry={fetchData} />}

            {/* Empty State */}
            {!isLoading && !error && isEmpty && (
                <EmptyState
                    title="No Performance Data Found"
                    message="No problem-solving sessions were found for the selected time window. Solve problems with the Chrome Extension to see your performance metrics."
                />
            )}

            {/* Content Display */}
            {!isLoading && !error && !isEmpty && analytics && (
                <>
                    {/* Summary Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCard
                            label="Total Sessions"
                            value={analytics.totalSessions ?? 0}
                            subtext="Recorded practice sessions"
                        />
                        <StatCard
                            label="Average Solve Time"
                            value={formatDuration(analytics.averageSolveTime)}
                            subtext="Mean active time per solve"
                        />
                        <StatCard
                            label="Average Attempts"
                            value={formatDecimal(analytics.averageAttempts)}
                            subtext="Submissions per solved problem"
                        />
                        <StatCard
                            label="First-Attempt Success"
                            value={formatRate(analytics.firstAttemptSuccessRate)}
                            tone={
                                (analytics.firstAttemptSuccessRate ?? 0) >= 70
                                    ? "success"
                                    : (analytics.firstAttemptSuccessRate ?? 0) >= 40
                                    ? "warning"
                                    : "danger"
                            }
                            subtext="Clean first-try accuracy"
                        />
                        <StatCard
                            label="Total Time"
                            value={formatDuration(analytics.totalTimeSpent)}
                            subtext="Cumulative active time"
                        />
                    </div>

                    {/* Secondary Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard
                            label="Problems Solved"
                            value={analytics.totalProblemsSolved ?? 0}
                            size="compact"
                            subtext="Completed problems in window"
                        />
                        <StatCard
                            label="Accepted Submissions"
                            value={analytics.totalAcceptedSubmissions ?? 0}
                            size="compact"
                            subtext="Total accepted code evaluations"
                        />
                        <StatCard
                            label="Wrong Submissions"
                            value={analytics.totalWrongSubmissions ?? 0}
                            size="compact"
                            subtext="Failed or error submissions"
                        />
                    </div>

                    {/* Difficulty Performance */}
                    <SectionCard
                        title="Difficulty Performance"
                        subtitle="Detailed performance across standard LeetCode difficulty tiers"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                                        <th className="pb-2.5 font-medium">Difficulty</th>
                                        <th className="pb-2.5 font-medium">Problems</th>
                                        <th className="pb-2.5 font-medium">Sessions</th>
                                        <th className="pb-2.5 font-medium">Average Solve Time</th>
                                        <th className="pb-2.5 font-medium">Average Attempts</th>
                                        <th className="pb-2.5 font-medium">1st Attempt Success</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                    {difficulties.map(({ key, label, dotClass }) => {
                                        const diffData = analytics.difficultyAnalytics?.[key];
                                        return (
                                            <tr
                                                key={key}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                                                        <span>{label}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                    {diffData?.problemsSolved ?? 0}
                                                </td>
                                                <td className="py-3 font-mono text-slate-400 dark:text-slate-500" title="Sessions metric not tracked separately in DifficultyAnalyticsDTO">
                                                    —
                                                </td>
                                                <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                    {formatDuration(diffData?.averageSolveTime)}
                                                </td>
                                                <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                    {formatDecimal(diffData?.averageAttempts)}
                                                </td>
                                                <td className="py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                                                    {formatRate(diffData?.firstAttemptSuccessRate)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>

                    {/* Topic Performance */}
                    <SectionCard
                        title="Topic Performance"
                        subtitle="Detailed performance breakdown by problem topic tags (Top 10)"
                    >
                        {topicList.length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                                No topic data available for this time window.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                                            <th className="pb-2.5 font-medium">Topic</th>
                                            <th className="pb-2.5 font-medium">Problems</th>
                                            <th className="pb-2.5 font-medium">Sessions</th>
                                            <th className="pb-2.5 font-medium">Average Solve Time</th>
                                            <th className="pb-2.5 font-medium">Average Attempts</th>
                                            <th className="pb-2.5 font-medium">1st Attempt Success</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                        {topicList.map((item) => (
                                            <tr
                                                key={item.topic}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="py-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                                                    {item.topic}
                                                </td>
                                                <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                    {item.problemsSolved ?? 0}
                                                </td>
                                                <td className="py-3 font-mono text-slate-400 dark:text-slate-500" title="Sessions metric not tracked separately in TopicAnalyticsDTO">
                                                    —
                                                </td>
                                                <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                    {formatDuration(item.averageSolveTime)}
                                                </td>
                                                <td className="py-3 font-mono text-slate-400 dark:text-slate-500" title="Average attempts not tracked separately in TopicAnalyticsDTO">
                                                    —
                                                </td>
                                                <td className="py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                                                    {formatRate(item.firstAttemptSuccessRate)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>

                    {/* Time Breakdown */}
                    <SectionCard
                        title="Time Breakdown"
                        subtitle="Detailed active time distribution across problem sessions"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard
                                label="Thinking Time"
                                value={formatDuration(analytics.averageThinkingTime)}
                                size="compact"
                                subtext="Mean pre-coding analysis"
                            />
                            <StatCard
                                label="Coding Time"
                                value={formatDuration(analytics.averageCodingTime)}
                                size="compact"
                                subtext="Mean active implementation"
                            />
                            <StatCard
                                label="Solve Time"
                                value={formatDuration(analytics.averageSolveTime)}
                                size="compact"
                                subtext="Mean active problem duration"
                            />
                            <StatCard
                                label="Total Active Time"
                                value={formatDuration(analytics.totalTimeSpent)}
                                size="compact"
                                subtext="Cumulative solving duration"
                            />
                        </div>
                    </SectionCard>

                    {/* Assistance Breakdown */}
                    <SectionCard
                        title="Assistance Breakdown"
                        subtitle="External help and reference material utilization rates"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard
                                label="Hint Usage"
                                value={formatRate(analytics.hintUsageRate)}
                                size="compact"
                                subtext="Sessions viewing hints"
                            />
                            <StatCard
                                label="Solution Views"
                                value={formatRate(analytics.solutionUsageRate)}
                                size="compact"
                                subtext="Sessions accessing solutions"
                            />
                            <StatCard
                                label="Editorial Views"
                                value={formatRate(analytics.editorialUsageRate)}
                                size="compact"
                                subtext="Sessions consulting editorial"
                            />
                            <StatCard
                                label="Hints / Problem"
                                value={formatDecimal(analytics.averageHintsPerProblem)}
                                size="compact"
                                subtext="Average hints revealed"
                            />
                        </div>
                    </SectionCard>
                </>
            )}
        </div>
    );
};

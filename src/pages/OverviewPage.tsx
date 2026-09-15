import React, { useEffect, useState } from "react";
import { AnalyticsApiService } from "../services/analyticsApiService";
import type { UserPerformanceProfile, TopicProfile, DifficultyProfile } from "../types/analytics";
import { StatCard } from "../components/StatCard";
import { SectionCard } from "../components/SectionCard";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { formatDuration, formatRate, formatDecimal } from "../utils/formatters";

export interface OverviewPageProps {
    token: string;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ token }) => {
    const [profile, setProfile] = useState<UserPerformanceProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await AnalyticsApiService.getUserProfile(token);
            setProfile(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load overview data.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token]);

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadData} />;
    }

    const overall = profile?.overall;
    const hasData = overall && overall.totalSessions > 0;

    if (!hasData) {
        return (
            <EmptyState
                title="No Practice Sessions Found"
                description="Start solving LeetCode problems with the ORCA Chrome Extension to track your progress and view detailed DSA metrics."
            />
        );
    }

    // Extract difficulty metrics with defaults
    const difficulties: { key: string; label: string; data: DifficultyProfile }[] = [
        {
            key: "EASY",
            label: "Easy",
            data: profile.difficultyPerformance?.EASY ||
                profile.difficultyPerformance?.Easy || {
                    uniqueProblemsSolved: 0,
                    totalSolvedSessions: 0,
                    sessionCount: 0,
                    averageSolveTime: 0,
                    averageAttempts: 0,
                    firstAttemptSuccessRate: 0,
                    hintUsageRate: 0,
                    solutionUsageRate: 0,
                    editorialUsageRate: 0
                }
        },
        {
            key: "MEDIUM",
            label: "Medium",
            data: profile.difficultyPerformance?.MEDIUM ||
                profile.difficultyPerformance?.Medium || {
                    uniqueProblemsSolved: 0,
                    totalSolvedSessions: 0,
                    sessionCount: 0,
                    averageSolveTime: 0,
                    averageAttempts: 0,
                    firstAttemptSuccessRate: 0,
                    hintUsageRate: 0,
                    solutionUsageRate: 0,
                    editorialUsageRate: 0
                }
        },
        {
            key: "HARD",
            label: "Hard",
            data: profile.difficultyPerformance?.HARD ||
                profile.difficultyPerformance?.Hard || {
                    uniqueProblemsSolved: 0,
                    totalSolvedSessions: 0,
                    sessionCount: 0,
                    averageSolveTime: 0,
                    averageAttempts: 0,
                    firstAttemptSuccessRate: 0,
                    hintUsageRate: 0,
                    solutionUsageRate: 0,
                    editorialUsageRate: 0
                }
        }
    ];

    // Extract top topics sorted by solved count / session count
    const topics: TopicProfile[] = Object.values(profile.topicPerformance || {})
        .sort((a, b) => (b.uniqueProblemsSolved || 0) - (a.uniqueProblemsSolved || 0) || (b.sessionCount || 0) - (a.sessionCount || 0))
        .slice(0, 8);

    return (
        <div className="space-y-6">
            {/* Top Primary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Unique Problems Solved"
                    value={overall.uniqueProblemsSolved ?? 0}
                    subtext="Distinct problems completed"
                />
                <StatCard
                    label="Solved Sessions"
                    value={overall.totalSolvedSessions ?? 0}
                    subtext="Successful practice sessions"
                />
                <StatCard
                    label="Average Solve Time"
                    value={formatDuration(overall.averageSolveTime)}
                    subtext="Active solving duration"
                />
                <StatCard
                    label="First-Attempt Success"
                    value={formatRate(overall.firstAttemptSuccessRate)}
                    tone={
                        (overall.firstAttemptSuccessRate ?? 0) >= 70
                            ? "success"
                            : (overall.firstAttemptSuccessRate ?? 0) >= 40
                            ? "warning"
                            : "danger"
                    }
                    subtext="Clean first-try accuracy"
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Total Sessions"
                    value={overall.totalSessions ?? 0}
                    size="compact"
                    subtext="Total attempted practice sessions"
                />
                <StatCard
                    label="Average Attempts"
                    value={formatDecimal(overall.averageAttempts)}
                    size="compact"
                    subtext="Mean submissions per solve"
                />
                <StatCard
                    label="Total Time"
                    value={formatDuration(overall.totalTimeSpent)}
                    size="compact"
                    subtext="Total active time tracked"
                />
            </div>

            {/* Difficulty Breakdown */}
            <SectionCard
                title="Difficulty"
                subtitle="Performance breakdown across standard LeetCode difficulty tiers"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                                <th className="pb-2.5 font-medium">Tier</th>
                                <th className="pb-2.5 font-medium">Solved</th>
                                <th className="pb-2.5 font-medium">Sessions</th>
                                <th className="pb-2.5 font-medium">First-Attempt Success</th>
                                <th className="pb-2.5 font-medium">Avg Solve Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                            {difficulties.map(({ key, label, data }) => (
                                <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`w-2 h-2 rounded-full ${
                                                    key === "EASY"
                                                        ? "bg-emerald-500"
                                                        : key === "MEDIUM"
                                                        ? "bg-amber-500"
                                                        : "bg-rose-500"
                                                }`}
                                            />
                                            <span>{label}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                        {data.uniqueProblemsSolved ?? 0}
                                    </td>
                                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                        {data.sessionCount ?? 0}
                                    </td>
                                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                        {formatRate(data.firstAttemptSuccessRate)}
                                    </td>
                                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                        {formatDuration(data.averageSolveTime)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            {/* Top Topics Section */}
            <SectionCard
                title="Top Topics"
                subtitle="Most practiced DSA categories and algorithmic patterns"
            >
                {topics.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                        No topic-specific records available yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                                    <th className="pb-2.5 font-medium">Topic</th>
                                    <th className="pb-2.5 font-medium">Solved</th>
                                    <th className="pb-2.5 font-medium">Sessions</th>
                                    <th className="pb-2.5 font-medium">Avg Attempts</th>
                                    <th className="pb-2.5 font-medium">First-Attempt Success</th>
                                    <th className="pb-2.5 font-medium">Avg Solve Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                {topics.map((t) => (
                                    <tr key={t.topic} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                                            {t.topic}
                                        </td>
                                        <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                            {t.uniqueProblemsSolved ?? 0}
                                        </td>
                                        <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                            {t.sessionCount ?? 0}
                                        </td>
                                        <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                            {formatDecimal(t.averageAttempts)}
                                        </td>
                                        <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                            {formatRate(t.firstAttemptSuccessRate)}
                                        </td>
                                        <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                            {formatDuration(t.averageSolveTime)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </div>
    );
};

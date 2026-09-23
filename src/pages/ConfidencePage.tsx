import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ConfidenceApiService } from "../services/confidenceApiService";
import { StatCard } from "../components/StatCard";
import { SectionCard } from "../components/SectionCard";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { formatRate, formatDecimal } from "../utils/formatters";
import type { ConfidenceResponse, Difficulty, AssistanceEffect } from "../types/confidence";

function getConfidenceBucket(score: number): {
    tone: "danger" | "warning" | "success";
    badgeClass: string;
} {
    if (score < 40) {
        return {
            tone: "danger",
            badgeClass: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
        };
    }
    if (score < 70) {
        return {
            tone: "warning",
            badgeClass: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60"
        };
    }
    return {
        tone: "success",
        badgeClass: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60"
    };
}

function getDifficultyBadgeClass(difficulty: Difficulty): string {
    switch (difficulty) {
        case "EASY":
            return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60";
        case "MEDIUM":
            return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60";
        case "HARD":
            return "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60";
    }
}

function formatAssistanceEffect(effect: AssistanceEffect): string {
    switch (effect) {
        case "NO_ASSISTANCE":
            return "No Assistance";
        case "VIEWED_HINTS":
            return "Viewed Hints";
        case "VIEWED_EDITORIAL":
            return "Viewed Editorial";
        case "VIEWED_SOLUTION":
            return "Viewed Solution";
    }
}

function formatTimestamp(isoString: string | null | undefined): string {
    if (!isoString) {
        return "—";
    }
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            return "—";
        }
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return "—";
    }
}

export const ConfidencePage: React.FC = () => {
    const [records, setRecords] = useState<ConfidenceResponse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ConfidenceApiService.getAllConfidence();
            setRecords(Array.isArray(data) ? data : []);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load confidence records.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Compute presentation aggregates across loaded records
    const { overallConfidenceMean, totalIndependentSolves, totalSuccessfulSolves } = useMemo(() => {
        if (records.length === 0) {
            return {
                overallConfidenceMean: 0,
                totalIndependentSolves: 0,
                totalSuccessfulSolves: 0
            };
        }

        const sumConfidence = records.reduce((acc, r) => acc + (r.currentConfidence ?? 0), 0);
        const indSolves = records.reduce((acc, r) => acc + (r.independentSolveCount ?? 0), 0);
        const succSolves = records.reduce((acc, r) => acc + (r.successfulSolveCount ?? 0), 0);

        return {
            overallConfidenceMean: sumConfidence / records.length,
            totalIndependentSolves: indSolves,
            totalSuccessfulSolves: succSolves
        };
    }, [records]);

    // Selected problem record for in-memory detail inspection
    const selectedRecord = useMemo(() => {
        if (selectedProblemId == null) {
            return null;
        }
        return records.find((r) => r.problemId === selectedProblemId) ?? null;
    }, [records, selectedProblemId]);

    if (isLoading) {
        return <LoadingState message="Loading confidence data..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadData} />;
    }

    if (records.length === 0) {
        return (
            <EmptyState
                title="No Confidence Data Found"
                description="Start solving LeetCode problems with the ORCA Chrome Extension. Confidence is generated from successfully solved problems based on solving, independence, and retention evidence."
            />
        );
    }

    const overallTone = getConfidenceBucket(overallConfidenceMean).tone;

    return (
        <div className="space-y-6">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Overall Confidence"
                    value={`${overallConfidenceMean.toFixed(1)} / 100`}
                    tone={overallTone}
                    subtext="Arithmetic mean across tracked problems"
                />
                <StatCard
                    label="Problems With Confidence"
                    value={records.length}
                    tone="neutral"
                    subtext="Tracked problem states"
                />
                <StatCard
                    label="Independent Solves"
                    value={totalIndependentSolves}
                    tone="neutral"
                    subtext="Solved without hints or solution"
                />
                <StatCard
                    label="Successful Solves"
                    value={totalSuccessfulSolves}
                    tone="neutral"
                    subtext="Total accepted completions"
                />
            </div>

            {/* Confidence By Problem Table */}
            <SectionCard
                title="Confidence By Problem"
                subtitle="Problem-level confidence metrics and retention strength (click a row to inspect evidence)"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                                <th className="pb-2.5 font-medium">Problem</th>
                                <th className="pb-2.5 font-medium">Difficulty</th>
                                <th className="pb-2.5 font-medium">Confidence</th>
                                <th className="pb-2.5 font-medium">Mastery</th>
                                <th className="pb-2.5 font-medium">Independence</th>
                                <th className="pb-2.5 font-medium">Retention</th>
                                <th className="pb-2.5 font-medium">Last Solved</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                            {records.map((r) => {
                                const isSelected = selectedProblemId === r.problemId;
                                const confStyle = getConfidenceBucket(r.currentConfidence ?? 0);
                                const diffStyle = getDifficultyBadgeClass(r.difficulty);

                                return (
                                    <tr
                                        key={r.problemId}
                                        onClick={() =>
                                            setSelectedProblemId((prev) =>
                                                prev === r.problemId ? null : r.problemId
                                            )
                                        }
                                        className={`cursor-pointer transition-colors ${
                                            isSelected
                                                ? "bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100"
                                                : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300"
                                        }`}
                                        aria-selected={isSelected}
                                    >
                                        <td className="py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                                            <span className="text-slate-400 dark:text-slate-500 mr-1.5">
                                                #{r.leetcodeId}
                                            </span>
                                            {r.problemTitle}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-md border ${diffStyle}`}
                                            >
                                                {r.difficulty}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md border ${confStyle.badgeClass}`}
                                            >
                                                {(r.currentConfidence ?? 0).toFixed(1)} / 100
                                            </span>
                                        </td>
                                        <td className="py-3 font-mono">
                                            {formatRate(r.masteryScore)}
                                        </td>
                                        <td className="py-3 font-mono">
                                            {formatRate(r.independenceScore)}
                                        </td>
                                        <td className="py-3 font-mono">
                                            {formatRate(r.retentionStrength)}
                                        </td>
                                        <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                                            {formatTimestamp(
                                                r.lastSuccessfulSolveAt || r.lastConfidenceUpdateAt
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            {/* In-Memory Problem Detail & Evidence History Card */}
            {selectedRecord && (
                <SectionCard
                    title={`Problem Detail: #${selectedRecord.leetcodeId} ${selectedRecord.problemTitle}`}
                    subtitle={`Algorithm Version: ${selectedRecord.algorithmVersion || "V1"} — Based on solving, independence, and retention evidence`}
                >
                    <div className="space-y-4">
                        {/* Quick Metrics Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">
                                    Current Confidence
                                </div>
                                <div className="text-base font-semibold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                                    {(selectedRecord.currentConfidence ?? 0).toFixed(1)} / 100
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">
                                    Mastery Score
                                </div>
                                <div className="text-base font-semibold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                                    {formatRate(selectedRecord.masteryScore)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">
                                    Independence Score
                                </div>
                                <div className="text-base font-semibold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                                    {formatRate(selectedRecord.independenceScore)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">
                                    Retention Strength
                                </div>
                                <div className="text-base font-semibold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                                    {formatRate(selectedRecord.retentionStrength)}
                                </div>
                            </div>
                        </div>

                        {/* Secondary Details */}
                        <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300 font-mono">
                            <div>
                                <span className="text-slate-400 dark:text-slate-500">Successful Solves: </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {selectedRecord.successfulSolveCount ?? 0}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 dark:text-slate-500">Independent Solves: </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {selectedRecord.independentSolveCount ?? 0}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 dark:text-slate-500">Last Solved: </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {formatTimestamp(selectedRecord.lastSuccessfulSolveAt)}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 dark:text-slate-500">Last Updated: </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {formatTimestamp(selectedRecord.lastConfidenceUpdateAt)}
                                </span>
                            </div>
                        </div>

                        {/* Evidence History */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                Confidence Evidence History
                            </h3>
                            {(!selectedRecord.history || selectedRecord.history.length === 0) ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
                                    No confidence adjustment events recorded yet.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                                                <th className="pb-2 font-medium">Timestamp</th>
                                                <th className="pb-2 font-medium">Transition</th>
                                                <th className="pb-2 font-medium">Mastery</th>
                                                <th className="pb-2 font-medium">Independence</th>
                                                <th className="pb-2 font-medium">Retention</th>
                                                <th className="pb-2 font-medium">Assistance</th>
                                                <th className="pb-2 font-medium">Away Effect</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                                            {selectedRecord.history.map((h) => (
                                                <tr
                                                    key={h.id}
                                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                                >
                                                    <td className="py-2 text-slate-600 dark:text-slate-400">
                                                        {formatTimestamp(h.timestamp)}
                                                    </td>
                                                    <td className="py-2 font-semibold text-slate-900 dark:text-slate-100">
                                                        {(h.previousConfidence ?? 0).toFixed(1)} → {(h.newConfidence ?? 0).toFixed(1)}
                                                    </td>
                                                    <td className="py-2 text-slate-700 dark:text-slate-300">
                                                        {formatDecimal(h.masteryContribution, 1)}
                                                    </td>
                                                    <td className="py-2 text-slate-700 dark:text-slate-300">
                                                        {formatDecimal(h.independenceContribution, 1)}
                                                    </td>
                                                    <td className="py-2 text-slate-700 dark:text-slate-300">
                                                        {formatDecimal(h.retentionContribution, 1)}
                                                    </td>
                                                    <td className="py-2">
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-sans">
                                                            {formatAssistanceEffect(h.assistanceEffect)}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(h.awayTimeEffect, 1)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>
            )}
        </div>
    );
};

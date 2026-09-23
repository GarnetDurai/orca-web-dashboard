import React, { useEffect, useState, useCallback, useMemo } from "react";
import { RevisionApiService } from "../services/revisionApiService";
import { ConfidenceApiService } from "../services/confidenceApiService";
import { StatCard } from "../components/StatCard";
import { SectionCard } from "../components/SectionCard";
import { LoadingState, ErrorState } from "../components/States";
import type {
    ReviewQueueResponse,
    ReviewQueueItem,
    RevisionState,
    RevisionHistory,
    Difficulty,
    ReviewOutcome
} from "../types/revision";
import type { ConfidenceResponse } from "../types/confidence";

function getDifficultyBadgeClass(difficulty: Difficulty | string): string {
    switch (difficulty) {
        case "EASY":
            return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60";
        case "MEDIUM":
            return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60";
        case "HARD":
            return "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60";
        default:
            return "text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800";
    }
}

function getConfidenceBadgeClass(score: number | null | undefined): string {
    if (score == null) {
        return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800";
    }
    if (score < 40) {
        return "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60";
    }
    if (score < 70) {
        return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60";
    }
    return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60";
}

function getOutcomeBadgeClass(outcome: ReviewOutcome | string | null | undefined): string {
    switch (outcome) {
        case "EASY":
            return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60";
        case "GOOD":
            return "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60";
        case "HARD":
            return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60";
        case "AGAIN":
            return "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60";
        default:
            return "text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800";
    }
}

function formatShortDate(isoString: string | null | undefined): string {
    if (!isoString) {
        return "—";
    }
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            return "—";
        }
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
        return "—";
    }
}

function formatFullDate(isoString: string | null | undefined): string {
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
            year: "numeric"
        });
    } catch {
        return "—";
    }
}

function formatOverdueText(overdueDays: number): string {
    if (overdueDays >= 1) {
        const days = Math.round(overdueDays);
        return `OVERDUE ${days} ${days === 1 ? "day" : "days"}`;
    }
    const hours = Math.max(1, Math.round(overdueDays * 24));
    return `OVERDUE ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function formatUpcomingDate(isoString: string): string {
    try {
        const target = new Date(isoString);
        if (isNaN(target.getTime())) return "—";

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);
        const startOfDayAfterTomorrow = new Date(startOfToday.getTime() + 86400000 * 2);

        if (target >= startOfTomorrow && target < startOfDayAfterTomorrow) {
            return "Tomorrow";
        }

        return target.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
        return "—";
    }
}

export const RevisionPage: React.FC = () => {
    const [todayData, setTodayData] = useState<ReviewQueueResponse | null>(null);
    const [allRevisions, setAllRevisions] = useState<RevisionState[]>([]);
    const [confidenceMap, setConfidenceMap] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Selected problem ID for detail inspection
    const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
    const [detailCache, setDetailCache] = useState<Record<number, RevisionState>>({});
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [queueRes, revisionsRes, confidenceRes] = await Promise.all([
                RevisionApiService.getTodayReviewQueue(),
                RevisionApiService.getAllRevisions(),
                ConfidenceApiService.getAllConfidence().catch(() => [] as ConfidenceResponse[])
            ]);

            setTodayData(queueRes);
            setAllRevisions(Array.isArray(revisionsRes) ? revisionsRes : []);

            // Build confidence map by problemId
            const confLookup: Record<number, number> = {};
            if (Array.isArray(confidenceRes)) {
                for (const c of confidenceRes) {
                    if (c.problemId != null && c.currentConfidence != null) {
                        confLookup[c.problemId] = c.currentConfidence;
                    }
                }
            }
            setConfidenceMap(confLookup);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load revision data.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Fetch problem detail and history when selected
    useEffect(() => {
        if (selectedProblemId == null) {
            return;
        }

        if (detailCache[selectedProblemId]) {
            return;
        }

        let isMounted = true;
        setIsDetailLoading(true);
        RevisionApiService.getRevisionForProblem(selectedProblemId)
            .then((data) => {
                if (isMounted && data) {
                    setDetailCache((prev) => ({ ...prev, [selectedProblemId]: data }));
                }
            })
            .catch(() => {
                // Silently ignore or retain fallback from list
            })
            .finally(() => {
                if (isMounted) {
                    setIsDetailLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [selectedProblemId, detailCache]);

    // Today Queue: partitioned into Overdue vs Due Today
    const { overdueItems, dueTodayItems } = useMemo(() => {
        if (!todayData || !todayData.queue) {
            return { overdueItems: [], dueTodayItems: [] };
        }

        const overdue: ReviewQueueItem[] = [];
        const dueToday: ReviewQueueItem[] = [];

        for (const item of todayData.queue) {
            if ((item.overdueDays ?? 0) > 0) {
                overdue.push(item);
            } else {
                dueToday.push(item);
            }
        }

        return { overdueItems: overdue, dueTodayItems: dueToday };
    }, [todayData]);

    // Upcoming Reviews: future scheduled reviews (not overdue, nextReviewAt > now)
    const upcomingReviews = useMemo(() => {
        const now = Date.now();
        return allRevisions
            .filter((r) => !r.isOverdue && new Date(r.nextReviewAt).getTime() > now)
            .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
    }, [allRevisions]);

    // Lookup map of all revisions for fallback fields
    const allRevisionsMap = useMemo(() => {
        const map = new Map<number, RevisionState>();
        for (const r of allRevisions) {
            map.set(r.problemId, r);
        }
        return map;
    }, [allRevisions]);

    // Selected problem entity resolution
    const selectedProblem = useMemo(() => {
        if (selectedProblemId == null) {
            return null;
        }

        // Check if in detailCache first
        if (detailCache[selectedProblemId]) {
            const cached = detailCache[selectedProblemId];
            const conf = confidenceMap[selectedProblemId];
            return {
                problemId: cached.problemId,
                leetcodeId: cached.leetcodeId,
                problemTitle: cached.problemTitle,
                difficulty: cached.difficulty,
                currentConfidence: conf != null ? conf : null,
                lastReviewedAt: cached.lastReviewedAt,
                nextReviewAt: cached.nextReviewAt,
                currentIntervalDays: cached.currentIntervalDays,
                reviewCount: cached.reviewCount,
                isOverdue: cached.isOverdue,
                overdueDays: cached.overdueDays,
                history: cached.history || []
            };
        }

        // Check if in todayData.queue
        const inQueue = todayData?.queue.find((i) => i.problemId === selectedProblemId);
        if (inQueue) {
            const state = allRevisionsMap.get(selectedProblemId);
            return {
                problemId: inQueue.problemId,
                leetcodeId: inQueue.leetcodeId,
                problemTitle: inQueue.problemTitle,
                difficulty: inQueue.difficulty,
                currentConfidence: inQueue.currentConfidence,
                lastReviewedAt: inQueue.lastReviewedAt || state?.lastReviewedAt || null,
                nextReviewAt: inQueue.nextReviewAt,
                currentIntervalDays: inQueue.currentIntervalDays,
                reviewCount: inQueue.reviewCount,
                isOverdue: (inQueue.overdueDays ?? 0) > 0,
                overdueDays: inQueue.overdueDays,
                history: state?.history || []
            };
        }

        // Fallback to allRevisions
        const inAll = allRevisionsMap.get(selectedProblemId);
        if (inAll) {
            const conf = confidenceMap[selectedProblemId];
            return {
                problemId: inAll.problemId,
                leetcodeId: inAll.leetcodeId,
                problemTitle: inAll.problemTitle,
                difficulty: inAll.difficulty,
                currentConfidence: conf != null ? conf : null,
                lastReviewedAt: inAll.lastReviewedAt,
                nextReviewAt: inAll.nextReviewAt,
                currentIntervalDays: inAll.currentIntervalDays,
                reviewCount: inAll.reviewCount,
                isOverdue: inAll.isOverdue,
                overdueDays: inAll.overdueDays,
                history: inAll.history || []
            };
        }

        return null;
    }, [selectedProblemId, detailCache, todayData, allRevisionsMap, confidenceMap]);

    if (isLoading) {
        return <LoadingState message="Loading revision schedule and queue..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadData} />;
    }

    const totalDue = todayData?.totalDue ?? 0;
    const overdueCount = overdueItems.length;
    const completedToday = todayData?.reviewsCompletedToday ?? 0;
    const newSolvedToday = todayData?.newProblemsSolvedToday ?? 0;
    const dailyCapacity = todayData?.dailyCapacity ?? 0;

    const hasQueue = overdueItems.length > 0 || dueTodayItems.length > 0;

    return (
        <div className="space-y-6">
            {/* 1. TODAY SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Due Reviews"
                    value={totalDue}
                    tone={totalDue > 0 ? "warning" : "neutral"}
                    subtext="Revisions ready for recall today"
                />
                <StatCard
                    label="Overdue Reviews"
                    value={overdueCount}
                    tone={overdueCount > 0 ? "danger" : "neutral"}
                    subtext="Past scheduled recall window"
                />
                <StatCard
                    label="Completed Reviews"
                    value={completedToday}
                    tone={completedToday > 0 ? "success" : "neutral"}
                    subtext={`${newSolvedToday} new problem${newSolvedToday === 1 ? "" : "s"} solved today`}
                />
                <StatCard
                    label="Review Capacity"
                    value={dailyCapacity}
                    tone="neutral"
                    subtext="Target review capacity for today"
                />
            </div>

            {/* 2. TODAY'S REVISION QUEUE */}
            <SectionCard
                title="Today's Revision Queue"
                subtitle="Prioritized problems to revisit today (click any row to view review history)"
            >
                {!hasQueue ? (
                    /* 7. EMPTY STATE */
                    <div className="py-10 text-center space-y-4">
                        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                You&apos;re caught up
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                No revisions are due right now.
                            </p>
                        </div>

                        {upcomingReviews.length > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Next review:</span>
                                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                                    {upcomingReviews[0].problemTitle}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500">·</span>
                                <span className="text-sky-600 dark:text-sky-400 font-medium">
                                    {formatUpcomingDate(upcomingReviews[0].nextReviewAt)}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                                    <th className="pb-2.5 font-medium">Problem</th>
                                    <th className="pb-2.5 font-medium">Difficulty</th>
                                    <th className="pb-2.5 font-medium">Confidence</th>
                                    <th className="pb-2.5 font-medium">Status</th>
                                    <th className="pb-2.5 font-medium">Last Review</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                {/* Overdue Subsection */}
                                {overdueItems.length > 0 && (
                                    <>
                                        <tr className="bg-rose-50/40 dark:bg-rose-950/20">
                                            <td colSpan={5} className="py-2 px-1 font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                                                Overdue ({overdueItems.length})
                                            </td>
                                        </tr>
                                        {overdueItems.map((item) => {
                                            const isSelected = selectedProblemId === item.problemId;
                                            const diffBadge = getDifficultyBadgeClass(item.difficulty);
                                            const confBadge = getConfidenceBadgeClass(item.currentConfidence);
                                            const stateFallback = allRevisionsMap.get(item.problemId);
                                            const lastReview = item.lastReviewedAt || stateFallback?.lastReviewedAt;

                                            return (
                                                <tr
                                                    key={`overdue-${item.problemId}`}
                                                    onClick={() =>
                                                        setSelectedProblemId((prev) =>
                                                            prev === item.problemId ? null : item.problemId
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
                                                            #{item.leetcodeId}
                                                        </span>
                                                        {item.problemTitle}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-md border ${diffBadge}`}>
                                                            {item.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md border ${confBadge}`}>
                                                            {(item.currentConfidence ?? 0).toFixed(1)} / 100
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md border text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60">
                                                            {formatOverdueText(item.overdueDays)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                                                        {formatShortDate(lastReview)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </>
                                )}

                                {/* Due Today Subsection */}
                                {dueTodayItems.length > 0 && (
                                    <>
                                        <tr className="bg-amber-50/40 dark:bg-amber-950/20">
                                            <td colSpan={5} className="py-2 px-1 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                                Due Today ({dueTodayItems.length})
                                            </td>
                                        </tr>
                                        {dueTodayItems.map((item) => {
                                            const isSelected = selectedProblemId === item.problemId;
                                            const diffBadge = getDifficultyBadgeClass(item.difficulty);
                                            const confBadge = getConfidenceBadgeClass(item.currentConfidence);
                                            const stateFallback = allRevisionsMap.get(item.problemId);
                                            const lastReview = item.lastReviewedAt || stateFallback?.lastReviewedAt;

                                            return (
                                                <tr
                                                    key={`due-${item.problemId}`}
                                                    onClick={() =>
                                                        setSelectedProblemId((prev) =>
                                                            prev === item.problemId ? null : item.problemId
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
                                                            #{item.leetcodeId}
                                                        </span>
                                                        {item.problemTitle}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-md border ${diffBadge}`}>
                                                            {item.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md border ${confBadge}`}>
                                                            {(item.currentConfidence ?? 0).toFixed(1)} / 100
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md border text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60">
                                                            DUE TODAY
                                                        </span>
                                                    </td>
                                                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                                                        {formatShortDate(lastReview)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {/* 5. SELECTED PROBLEM DETAIL PANEL */}
            {selectedProblem && (
                <SectionCard
                    title="Selected Problem Review"
                    subtitle="SRS parameters, scheduling status, and historical recall progression"
                >
                    <div className="space-y-6">
                        {/* Header with Title, Difficulty, and Open on LeetCode button */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-md border ${getDifficultyBadgeClass(selectedProblem.difficulty)}`}>
                                    {selectedProblem.difficulty}
                                </span>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                    <span className="text-slate-400 dark:text-slate-500 mr-1.5">
                                        #{selectedProblem.leetcodeId}
                                    </span>
                                    {selectedProblem.problemTitle}
                                </h3>
                            </div>

                            {/* 9. Passive SRS Action: Open problem on LeetCode */}
                            <a
                                href={`https://leetcode.com/problems/${selectedProblem.leetcodeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors cursor-pointer w-fit"
                            >
                                <span>Open on LeetCode</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </a>
                        </div>

                        {/* SRS State Attributes Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-mono">
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Confidence</div>
                                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {selectedProblem.currentConfidence != null
                                        ? `${selectedProblem.currentConfidence.toFixed(1)} / 100`
                                        : "—"}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Status</div>
                                <div className="mt-1 font-semibold">
                                    {selectedProblem.isOverdue ? (
                                        <span className="text-rose-600 dark:text-rose-400">
                                            {formatOverdueText(selectedProblem.overdueDays)}
                                        </span>
                                    ) : new Date(selectedProblem.nextReviewAt).getTime() <= Date.now() ? (
                                        <span className="text-amber-600 dark:text-amber-400">DUE TODAY</span>
                                    ) : (
                                        <span className="text-sky-600 dark:text-sky-400">UPCOMING</span>
                                    )}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Last Reviewed</div>
                                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {formatShortDate(selectedProblem.lastReviewedAt)}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Review Count</div>
                                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {selectedProblem.reviewCount ?? 0}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Current Interval</div>
                                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {selectedProblem.currentIntervalDays} days
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Next Review</div>
                                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {formatShortDate(selectedProblem.nextReviewAt)}
                                </div>
                            </div>
                        </div>

                        {/* Revision History Section */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Revision History
                            </h4>

                            {isDetailLoading && !detailCache[selectedProblem.problemId] ? (
                                <div className="py-4 text-center text-xs text-slate-400 font-mono">
                                    Loading history...
                                </div>
                            ) : selectedProblem.history.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                                    Initial solve scheduled into SRS. No subsequent review sessions recorded yet.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse font-mono">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px]">
                                                <th className="pb-2 font-medium">Date</th>
                                                <th className="pb-2 font-medium">Outcome</th>
                                                <th className="pb-2 font-medium">Interval Progression</th>
                                                <th className="pb-2 font-medium">Confidence Change</th>
                                                <th className="pb-2 font-medium">Retention</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {selectedProblem.history.map((entry: RevisionHistory) => (
                                                <tr key={entry.id} className="text-slate-700 dark:text-slate-300">
                                                    <td className="py-2.5 text-slate-500 dark:text-slate-400">
                                                        {formatFullDate(entry.reviewedAt)}
                                                    </td>
                                                    <td className="py-2.5">
                                                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getOutcomeBadgeClass(entry.outcome)}`}>
                                                            {entry.outcome}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5">
                                                        {entry.previousIntervalDays}d → <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.newIntervalDays}d</span>
                                                    </td>
                                                    <td className="py-2.5">
                                                        {(entry.previousConfidence ?? 0).toFixed(1)} →{" "}
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {(entry.newConfidence ?? 0).toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-slate-500 dark:text-slate-400">
                                                        {(entry.newRetentionStrength ?? 0).toFixed(1)}%
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

            {/* 6. UPCOMING REVIEWS */}
            <SectionCard
                title="Upcoming Reviews"
                subtitle="Lightweight schedule preview of upcoming reviews over the next few days"
            >
                {upcomingReviews.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3 text-center">
                        No future reviews scheduled.
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                        {upcomingReviews.map((item) => {
                            const isSelected = selectedProblemId === item.problemId;
                            const diffBadge = getDifficultyBadgeClass(item.difficulty);
                            const upcomingDateText = formatUpcomingDate(item.nextReviewAt);

                            return (
                                <div
                                    key={`upcoming-${item.problemId}`}
                                    onClick={() =>
                                        setSelectedProblemId((prev) =>
                                            prev === item.problemId ? null : item.problemId
                                        )
                                    }
                                    className={`py-3 px-2 flex items-center justify-between cursor-pointer rounded-md transition-colors ${
                                        isSelected
                                            ? "bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100"
                                            : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-sky-600 dark:text-sky-400 min-w-[75px]">
                                            {upcomingDateText}
                                        </span>
                                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${diffBadge}`}>
                                            {item.difficulty}
                                        </span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                            <span className="text-slate-400 dark:text-slate-500 mr-1.5">
                                                #{item.leetcodeId}
                                            </span>
                                            {item.problemTitle}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                                        <span>{item.currentIntervalDays}d interval</span>
                                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md border text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                            UPCOMING
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SectionCard>
        </div>
    );
};

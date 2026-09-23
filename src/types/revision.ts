import type { Difficulty } from "./confidence";

export type { Difficulty };

export type ReviewOutcome = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface ReviewCapacity {
    dailyCapacity: number;
    activeDaysLast30Days: number;
    medianDailyReviews: number;
    newProblemsPerActiveDay: number;
    reviewProblemsPerActiveDay: number;
    reviewsCompletedToday: number;
    newProblemsSolvedToday: number;
}

export interface ReviewQueueItem {
    problemId: number;
    leetcodeId: number;
    problemTitle: string;
    difficulty: Difficulty;
    lastReviewedAt?: string | null;
    nextReviewAt: string;
    currentIntervalDays: number;
    reviewCount: number;
    skipCount: number;
    currentConfidence: number;
    retentionStrength: number;
    overdueDays: number;
    overduePressure: number;
    memoryRisk: number;
    fairnessScore: number;
    priority: number;
    fairnessRequired: boolean;
    queuePosition: number;
}

export interface ReviewQueueResponse {
    queue: ReviewQueueItem[];
    totalDue: number;
    dailyCapacity: number;
    backlogCount: number;
    fairnessRequiredCount: number;
    reviewsCompletedToday: number;
    newProblemsSolvedToday: number;
    capacityDetails: ReviewCapacity;
}

export interface RevisionHistory {
    id: number;
    sourceSessionId: string;
    reviewedAt: string;
    outcome: ReviewOutcome | string;
    previousIntervalDays: number;
    newIntervalDays: number;
    previousConfidence: number;
    newConfidence: number;
    previousRetentionStrength: number;
    newRetentionStrength: number;
    previousNextReviewAt: string | null;
    newNextReviewAt: string;
    actualRecallIntervalDays: number;
    plannedIntervalDays: number;
    priorityAtSelection: number;
    algorithmVersion: string;
}

export interface RevisionState {
    id: number;
    problemId: number;
    leetcodeId: number;
    problemTitle: string;
    difficulty: Difficulty;
    reviewCount: number;
    currentIntervalDays: number;
    lastReviewedAt: string | null;
    nextReviewAt: string;
    skipCount: number;
    isOverdue: boolean;
    overdueDays: number;
    algorithmVersion: string;
    history: RevisionHistory[];
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type AssistanceEffect =
    | "NO_ASSISTANCE"
    | "VIEWED_HINTS"
    | "VIEWED_EDITORIAL"
    | "VIEWED_SOLUTION";

export interface ConfidenceHistory {
    id: number;
    timestamp: string;
    previousConfidence: number;
    newConfidence: number;
    masteryContribution: number;
    independenceContribution: number;
    retentionContribution: number;
    assistanceEffect: AssistanceEffect;
    awayTimeEffect: number;
    algorithmVersion: string;
}

export interface ConfidenceResponse {
    problemId: number;
    leetcodeId: number;
    problemTitle: string;
    difficulty: Difficulty;
    currentConfidence: number;
    masteryScore: number;
    independenceScore: number;
    retentionStrength: number;
    successfulSolveCount: number;
    independentSolveCount: number;
    lastSuccessfulSolveAt: string | null;
    lastConfidenceUpdateAt: string | null;
    algorithmVersion: string;
    history: ConfidenceHistory[];
}

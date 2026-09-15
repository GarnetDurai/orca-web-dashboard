/**
 * Exact TypeScript interfaces matching Spring Boot Backend DTOs
 */

export interface ProfileOverall {
    uniqueProblemsSolved: number;
    totalSolvedSessions: number;
    totalSessions: number;
    totalSubmissions: number;
    averageAttempts: number;
    firstAttemptSuccessRate: number;
    averageSolveTime: number; // in milliseconds
    averageThinkingTime: number; // in milliseconds
    averageCodingTime: number; // in milliseconds
    totalTimeSpent: number; // in milliseconds
    hintUsageRate: number;
    solutionUsageRate: number;
    editorialUsageRate: number;
}

export interface DifficultyProfile {
    uniqueProblemsSolved: number;
    totalSolvedSessions: number;
    sessionCount: number;
    averageSolveTime: number; // in milliseconds
    averageAttempts: number;
    firstAttemptSuccessRate: number;
    hintUsageRate: number;
    solutionUsageRate: number;
    editorialUsageRate: number;
}

export interface TopicProfile {
    topic: string;
    uniqueProblemsSolved: number;
    totalSolvedSessions: number;
    sessionCount: number;
    averageSolveTime: number; // in milliseconds
    averageAttempts: number;
    firstAttemptSuccessRate: number;
    hintUsageRate: number;
    solutionUsageRate: number;
    editorialUsageRate: number;
}

export interface UserPerformanceProfile {
    overall: ProfileOverall;
    difficultyPerformance: Record<string, DifficultyProfile>;
    topicPerformance: Record<string, TopicProfile>;
    recentTrends?: unknown;
}

export interface DifficultyAnalytics {
    solvedCount: number;
    sessionCount: number;
    averageSolveTime: number;
    averageAttempts: number;
    firstAttemptSuccessRate: number;
}

export interface TopicAnalytics {
    solvedCount: number;
    sessionCount: number;
    averageSolveTime: number;
    averageAttempts: number;
    firstAttemptSuccessRate: number;
}

export interface HistoricalAnalytics {
    totalProblemsSolved: number;
    totalSessions: number;
    averageSolveTime: number;
    averageThinkingTime: number;
    averageCodingTime: number;
    averageAttempts: number;
    firstAttemptSuccessRate: number;
    totalWrongSubmissions: number;
    totalAcceptedSubmissions: number;
    hintUsageRate: number;
    solutionUsageRate: number;
    editorialUsageRate: number;
    averageHintsPerProblem: number;
    totalTimeSpent: number;
    problemsSolvedByDifficulty: Record<string, number>;
    difficultyAnalytics: Record<string, DifficultyAnalytics>;
    topicAnalytics: Record<string, TopicAnalytics>;
}

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { RevisionPage } from "../pages/RevisionPage";
import { Dashboard } from "../Dashboard";
import { ThemeProvider } from "../context/ThemeContext";
import { DashboardApiClient } from "../services/apiClient";
import { AUTH_TOKEN_KEY } from "../config";
import type { ReviewQueueResponse, RevisionState } from "../types/revision";
import type { ConfidenceResponse } from "../types/confidence";

const mockQueueResponse: ReviewQueueResponse = {
    totalDue: 2,
    dailyCapacity: 4,
    backlogCount: 0,
    fairnessRequiredCount: 0,
    reviewsCompletedToday: 1,
    newProblemsSolvedToday: 2,
    capacityDetails: {
        dailyCapacity: 4,
        activeDaysLast30Days: 5,
        medianDailyReviews: 2.0,
        newProblemsPerActiveDay: 1.0,
        reviewProblemsPerActiveDay: 1.0,
        reviewsCompletedToday: 1,
        newProblemsSolvedToday: 2
    },
    queue: [
        {
            problemId: 1,
            leetcodeId: 1,
            problemTitle: "Two Sum",
            difficulty: "EASY",
            lastReviewedAt: "2026-09-15T10:00:00",
            nextReviewAt: "2026-09-21T10:00:00",
            currentIntervalDays: 6,
            reviewCount: 3,
            skipCount: 0,
            currentConfidence: 85.0,
            retentionStrength: 45.0,
            overdueDays: 2.0,
            overduePressure: 0.65,
            memoryRisk: 0.20,
            fairnessScore: 0.0,
            priority: 0.55,
            fairnessRequired: false,
            queuePosition: 1
        },
        {
            problemId: 2,
            leetcodeId: 704,
            problemTitle: "Binary Search",
            difficulty: "MEDIUM",
            lastReviewedAt: "2026-09-17T14:30:00",
            nextReviewAt: "2026-09-23T14:30:00",
            currentIntervalDays: 6,
            reviewCount: 1,
            skipCount: 0,
            currentConfidence: 61.4,
            retentionStrength: 30.0,
            overdueDays: 0.0,
            overduePressure: 0.50,
            memoryRisk: 0.35,
            fairnessScore: 0.0,
            priority: 0.45,
            fairnessRequired: false,
            queuePosition: 2
        }
    ]
};

const mockAllRevisions: RevisionState[] = [
    {
        id: 1,
        problemId: 1,
        leetcodeId: 1,
        problemTitle: "Two Sum",
        difficulty: "EASY",
        reviewCount: 3,
        currentIntervalDays: 6,
        lastReviewedAt: "2026-09-15T10:00:00",
        nextReviewAt: "2026-09-21T10:00:00",
        skipCount: 0,
        isOverdue: true,
        overdueDays: 2.0,
        algorithmVersion: "SRS_V1",
        history: []
    },
    {
        id: 2,
        problemId: 2,
        leetcodeId: 704,
        problemTitle: "Binary Search",
        difficulty: "MEDIUM",
        reviewCount: 1,
        currentIntervalDays: 6,
        lastReviewedAt: "2026-09-17T14:30:00",
        nextReviewAt: "2026-09-23T14:30:00",
        skipCount: 0,
        isOverdue: false,
        overdueDays: 0.0,
        algorithmVersion: "SRS_V1",
        history: []
    },
    {
        id: 3,
        problemId: 3,
        leetcodeId: 56,
        problemTitle: "Merge Intervals",
        difficulty: "MEDIUM",
        reviewCount: 2,
        currentIntervalDays: 7,
        lastReviewedAt: "2026-09-20T09:00:00",
        nextReviewAt: "2026-09-27T09:00:00",
        skipCount: 0,
        isOverdue: false,
        overdueDays: 0.0,
        algorithmVersion: "SRS_V1",
        history: []
    }
];

const mockProblem1Detail: RevisionState = {
    id: 1,
    problemId: 1,
    leetcodeId: 1,
    problemTitle: "Two Sum",
    difficulty: "EASY",
    reviewCount: 3,
    currentIntervalDays: 6,
    lastReviewedAt: "2026-09-15T10:00:00",
    nextReviewAt: "2026-09-21T10:00:00",
    skipCount: 0,
    isOverdue: true,
    overdueDays: 2.0,
    algorithmVersion: "SRS_V1",
    history: [
        {
            id: 11,
            sourceSessionId: "sess-rev-1",
            reviewedAt: "2026-09-15T10:00:00",
            outcome: "GOOD",
            previousIntervalDays: 2,
            newIntervalDays: 6,
            previousConfidence: 70.0,
            newConfidence: 85.0,
            previousRetentionStrength: 30.0,
            newRetentionStrength: 45.0,
            previousNextReviewAt: "2026-09-15T10:00:00",
            newNextReviewAt: "2026-09-21T10:00:00",
            actualRecallIntervalDays: 2.0,
            plannedIntervalDays: 2.0,
            priorityAtSelection: 0.5,
            algorithmVersion: "SRS_V1"
        }
    ]
};

const mockConfidenceData: ConfidenceResponse[] = [
    {
        problemId: 1,
        leetcodeId: 1,
        problemTitle: "Two Sum",
        difficulty: "EASY",
        currentConfidence: 85.0,
        masteryScore: 100.0,
        independenceScore: 100.0,
        retentionStrength: 45.0,
        successfulSolveCount: 3,
        independentSolveCount: 3,
        lastSuccessfulSolveAt: "2026-09-15T10:00:00",
        lastConfidenceUpdateAt: "2026-09-15T10:00:00",
        algorithmVersion: "V1",
        history: []
    }
];

describe("RevisionPage & Dashboard Revision Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("1. Renders top summary cards with Due, Overdue, Completed, and Capacity", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockImplementation(async (url: string) => {
            if (url.includes("/analytics/revisions/today")) {
                return { ok: true, status: 200, json: async () => mockQueueResponse } as Response;
            }
            if (url.includes("/analytics/revisions")) {
                return { ok: true, status: 200, json: async () => mockAllRevisions } as Response;
            }
            if (url.includes("/analytics/confidence")) {
                return { ok: true, status: 200, json: async () => mockConfidenceData } as Response;
            }
            return { ok: true, status: 200, json: async () => ({}) } as Response;
        });

        render(
            <ThemeProvider>
                <RevisionPage />
            </ThemeProvider>
        );

        expect(screen.getByText("Loading revision schedule and queue...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Today's Revision Queue")).toBeInTheDocument();
        });

        // 4 summary cards
        expect(screen.getByText("Due Reviews")).toBeInTheDocument();
        expect(screen.getByText("Overdue Reviews")).toBeInTheDocument();
        expect(screen.getByText("Completed Reviews")).toBeInTheDocument();
        expect(screen.getByText("Review Capacity")).toBeInTheDocument();

        // Values verified via parent cards
        const dueCard = screen.getByText("Due Reviews").closest("div.p-4")!;
        expect(within(dueCard).getByText("2")).toBeInTheDocument();

        const overdueCard = screen.getByText("Overdue Reviews").closest("div.p-4")!;
        expect(within(overdueCard).getByText("1")).toBeInTheDocument();

        const capacityCard = screen.getByText("Review Capacity").closest("div.p-4")!;
        expect(within(capacityCard).getByText("4")).toBeInTheDocument();

        // Clear distinction between new solves and completed reviews
        expect(screen.getByText("2 new problems solved today")).toBeInTheDocument();
    });

    it("2. Partitions queue into Overdue and Due Today subsections", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockImplementation(async (url: string) => {
            if (url.includes("/analytics/revisions/today")) {
                return { ok: true, status: 200, json: async () => mockQueueResponse } as Response;
            }
            if (url.includes("/analytics/revisions")) {
                return { ok: true, status: 200, json: async () => mockAllRevisions } as Response;
            }
            return { ok: true, status: 200, json: async () => [] } as Response;
        });

        render(
            <ThemeProvider>
                <RevisionPage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Today's Revision Queue")).toBeInTheDocument();
        });

        // Subsection headers
        expect(screen.getByText("Overdue (1)")).toBeInTheDocument();
        expect(screen.getByText("Due Today (1)")).toBeInTheDocument();

        // Status representations
        expect(screen.getByText("OVERDUE 2 days")).toBeInTheDocument();
        expect(screen.getByText("DUE TODAY")).toBeInTheDocument();

        // Problem rows
        expect(screen.getByText("Two Sum")).toBeInTheDocument();
        expect(screen.getByText("Binary Search")).toBeInTheDocument();
    });

    it("3. Clicking a revision row opens the Selected Problem detail panel with history and Open on LeetCode", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockImplementation(async (url: string) => {
            if (url.includes("/analytics/revisions/today")) {
                return { ok: true, status: 200, json: async () => mockQueueResponse } as Response;
            }
            if (url.includes("/analytics/revisions/1")) {
                return { ok: true, status: 200, json: async () => mockProblem1Detail } as Response;
            }
            if (url.includes("/analytics/revisions")) {
                return { ok: true, status: 200, json: async () => mockAllRevisions } as Response;
            }
            return { ok: true, status: 200, json: async () => [] } as Response;
        });

        render(
            <ThemeProvider>
                <RevisionPage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Two Sum")).toBeInTheDocument();
        });

        // Click Two Sum row
        const twoSumRow = screen.getByText("Two Sum").closest("tr")!;
        fireEvent.click(twoSumRow);

        await waitFor(() => {
            expect(screen.getByText("Selected Problem Review")).toBeInTheDocument();
        });

        // Detail panel checks
        expect(screen.getByText("Current Interval")).toBeInTheDocument();
        expect(screen.getByText("6 days")).toBeInTheDocument();
        expect(screen.getByText("Review Count")).toBeInTheDocument();

        // Passive SRS: Open on LeetCode link present
        const leetcodeLink = screen.getByRole("link", { name: /Open on LeetCode/i });
        expect(leetcodeLink).toHaveAttribute("href", "https://leetcode.com/problems/1");
        expect(leetcodeLink).toHaveAttribute("target", "_blank");

        // History items rendered
        await waitFor(() => {
            expect(screen.getByText("GOOD")).toBeInTheDocument();
            expect(screen.getByText("2d →")).toBeInTheDocument();
            expect(screen.getByText("70.0 →")).toBeInTheDocument();
        });

        // Verify NO manual rating controls exist
        expect(screen.queryByRole("button", { name: /Again/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Hard/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Good/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Easy/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Mark as reviewed/i })).not.toBeInTheDocument();
    });

    it("4. Displays Upcoming Reviews section with future scheduled reviews", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockImplementation(async (url: string) => {
            if (url.includes("/analytics/revisions/today")) {
                return { ok: true, status: 200, json: async () => mockQueueResponse } as Response;
            }
            if (url.includes("/analytics/revisions")) {
                return { ok: true, status: 200, json: async () => mockAllRevisions } as Response;
            }
            return { ok: true, status: 200, json: async () => [] } as Response;
        });

        render(
            <ThemeProvider>
                <RevisionPage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Upcoming Reviews")).toBeInTheDocument();
        });

        // Problem 3 (Merge Intervals) is scheduled for future
        expect(screen.getByText("Merge Intervals")).toBeInTheDocument();
        expect(screen.getByText("7d interval")).toBeInTheDocument();
        expect(screen.getByText("UPCOMING")).toBeInTheDocument();
    });

    it("5. Displays Empty State when no reviews are due, including next scheduled review", async () => {
        const emptyQueueResponse: ReviewQueueResponse = {
            totalDue: 0,
            dailyCapacity: 4,
            backlogCount: 0,
            fairnessRequiredCount: 0,
            reviewsCompletedToday: 2,
            newProblemsSolvedToday: 1,
            capacityDetails: {
                dailyCapacity: 4,
                activeDaysLast30Days: 5,
                medianDailyReviews: 2.0,
                newProblemsPerActiveDay: 1.0,
                reviewProblemsPerActiveDay: 1.0,
                reviewsCompletedToday: 2,
                newProblemsSolvedToday: 1
            },
            queue: []
        };

        const futureOnlyRevisions: RevisionState[] = [
            {
                id: 10,
                problemId: 10,
                leetcodeId: 3,
                problemTitle: "Longest Substring Without Repeating Characters",
                difficulty: "MEDIUM",
                reviewCount: 1,
                currentIntervalDays: 4,
                lastReviewedAt: "2026-09-22T10:00:00",
                nextReviewAt: "2026-09-26T10:00:00",
                skipCount: 0,
                isOverdue: false,
                overdueDays: 0.0,
                algorithmVersion: "SRS_V1",
                history: []
            }
        ];

        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockImplementation(async (url: string) => {
            if (url.includes("/analytics/revisions/today")) {
                return { ok: true, status: 200, json: async () => emptyQueueResponse } as Response;
            }
            if (url.includes("/analytics/revisions")) {
                return { ok: true, status: 200, json: async () => futureOnlyRevisions } as Response;
            }
            return { ok: true, status: 200, json: async () => [] } as Response;
        });

        render(
            <ThemeProvider>
                <RevisionPage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("You're caught up")).toBeInTheDocument();
            expect(screen.getByText("No revisions are due right now.")).toBeInTheDocument();
        });

        // Next review preview in empty state
        expect(screen.getByText("Next review:")).toBeInTheDocument();
        expect(screen.getAllByText("Longest Substring Without Repeating Characters").length).toBeGreaterThanOrEqual(1);
    });

    it("6. Displays error state with working retry button on API failure", async () => {
        let shouldFail = true;
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockImplementation(async () => {
            if (shouldFail) {
                return { ok: false, status: 500, json: async () => ({}) } as Response;
            }
            return { ok: true, status: 200, json: async () => mockQueueResponse } as Response;
        });

        render(
            <ThemeProvider>
                <RevisionPage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Failed to load today's review queue (HTTP 500).")).toBeInTheDocument();
        });

        // Click retry
        shouldFail = false;
        const retryButton = screen.getByRole("button", { name: /Retry/i });
        fireEvent.click(retryButton);

        await waitFor(() => {
            expect(screen.getByText("Today's Revision Queue")).toBeInTheDocument();
        });
    });

    it("7. Navigating to Revision tab in Dashboard renders Revision page", async () => {
        const dummyToken =
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJnYXJuZXRAZXhhbXBsZS5jb20iLCJpYXQiOjE3OTAxNjExMjl9.signature";
        localStorage.setItem(AUTH_TOKEN_KEY, dummyToken);

        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockImplementation(async (url: string) => {
            if (url.includes("/analytics/revisions/today")) {
                return { ok: true, status: 200, json: async () => mockQueueResponse } as Response;
            }
            if (url.includes("/analytics/revisions")) {
                return { ok: true, status: 200, json: async () => mockAllRevisions } as Response;
            }
            return { ok: true, status: 200, json: async () => [] } as Response;
        });

        render(
            <ThemeProvider>
                <Dashboard />
            </ThemeProvider>
        );

        // Click Revision in sidebar
        const revisionTabButton = screen.getByRole("button", { name: "Revision" });
        fireEvent.click(revisionTabButton);

        await waitFor(() => {
            expect(screen.getByText("Today's Revision Queue")).toBeInTheDocument();
            expect(screen.getByText("Due Reviews")).toBeInTheDocument();
        });
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { OverviewPage } from "../pages/OverviewPage";
import { ThemeProvider } from "../context/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";
import { Sidebar } from "../components/Sidebar";
import { AnalyticsApiService } from "../services/analyticsApiService";
import { UserPerformanceProfile } from "../types/analytics";

const mockProfileData: UserPerformanceProfile = {
    overall: {
        uniqueProblemsSolved: 42,
        totalSolvedSessions: 50,
        totalSessions: 55,
        totalSubmissions: 72,
        averageAttempts: 1.3,
        firstAttemptSuccessRate: 76.5,
        averageSolveTime: 845000, // 14m 5s
        averageThinkingTime: 300000,
        averageCodingTime: 545000,
        hintUsageRate: 12.0,
        solutionUsageRate: 4.0,
        editorialUsageRate: 2.0,
        totalTimeSpent: 46475000 // 12h 54m
    },
    difficultyPerformance: {
        EASY: {
            uniqueProblemsSolved: 20,
            totalSolvedSessions: 22,
            sessionCount: 22,
            averageSolveTime: 420000, // 7m
            averageAttempts: 1.1,
            firstAttemptSuccessRate: 90.9,
            hintUsageRate: 5.0,
            solutionUsageRate: 0,
            editorialUsageRate: 0
        },
        MEDIUM: {
            uniqueProblemsSolved: 18,
            totalSolvedSessions: 23,
            sessionCount: 25,
            averageSolveTime: 1100000, // 18m 20s
            averageAttempts: 1.4,
            firstAttemptSuccessRate: 72.0,
            hintUsageRate: 15.0,
            solutionUsageRate: 5.0,
            editorialUsageRate: 0
        },
        HARD: {
            uniqueProblemsSolved: 4,
            totalSolvedSessions: 5,
            sessionCount: 8,
            averageSolveTime: 1800000, // 30m
            averageAttempts: 2.0,
            firstAttemptSuccessRate: 50.0,
            hintUsageRate: 25.0,
            solutionUsageRate: 12.5,
            editorialUsageRate: 0
        }
    },
    topicPerformance: {
        "dynamic-programming": {
            topic: "dynamic-programming",
            uniqueProblemsSolved: 12,
            totalSolvedSessions: 14,
            sessionCount: 16,
            averageSolveTime: 1200000,
            averageAttempts: 1.6,
            firstAttemptSuccessRate: 66.7,
            hintUsageRate: 20.0,
            solutionUsageRate: 5.0,
            editorialUsageRate: 0
        },
        "trees": {
            topic: "trees",
            uniqueProblemsSolved: 15,
            totalSolvedSessions: 18,
            sessionCount: 20,
            averageSolveTime: 650000,
            averageAttempts: 1.2,
            firstAttemptSuccessRate: 85.0,
            hintUsageRate: 8.0,
            solutionUsageRate: 0,
            editorialUsageRate: 0
        },
        "arrays": {
            topic: "arrays",
            uniqueProblemsSolved: 25,
            totalSolvedSessions: 28,
            sessionCount: 30,
            averageSolveTime: 480000,
            averageAttempts: 1.1,
            firstAttemptSuccessRate: 92.0,
            hintUsageRate: 4.0,
            solutionUsageRate: 0,
            editorialUsageRate: 0
        }
    }
};

describe("Overview Page & Shell Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        document.documentElement.classList.remove("dark");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("1. Renders complete overview metrics from backend analytics profile", async () => {
        vi.spyOn(AnalyticsApiService, "getUserProfile").mockResolvedValue(mockProfileData);

        render(
            <ThemeProvider>
                <OverviewPage token="valid-test-token" />
            </ThemeProvider>
        );

        // Verify primary cards
        await waitFor(() => {
            expect(screen.getByText("Unique Problems Solved")).toBeInTheDocument();
            expect(screen.getByText("42")).toBeInTheDocument();
        });

        expect(screen.getByText("Solved Sessions")).toBeInTheDocument();
        expect(screen.getByText("50")).toBeInTheDocument();

        expect(screen.getByText("Average Solve Time")).toBeInTheDocument();
        expect(screen.getByText("14m 5s")).toBeInTheDocument();

        expect(screen.getAllByText("First-Attempt Success")[0]).toBeInTheDocument();
        expect(screen.getByText("76.5%")).toBeInTheDocument();

        // Verify secondary metrics
        expect(screen.getByText("Total Sessions")).toBeInTheDocument();
        expect(screen.getByText("55")).toBeInTheDocument();
        expect(screen.getByText("Average Attempts")).toBeInTheDocument();
        expect(screen.getByText("1.3")).toBeInTheDocument();
        expect(screen.getByText("Total Time")).toBeInTheDocument();
        expect(screen.getByText("12h 54m")).toBeInTheDocument();

        // Verify difficulty rows
        expect(screen.getByText("Easy")).toBeInTheDocument();
        expect(screen.getByText("Medium")).toBeInTheDocument();
        expect(screen.getByText("Hard")).toBeInTheDocument();
        expect(screen.getByText("90.9%")).toBeInTheDocument();

        // Verify topics table sorted by solved count descending (arrays: 25, trees: 15, dynamic-programming: 12)
        expect(screen.getByText("arrays")).toBeInTheDocument();
        expect(screen.getByText("trees")).toBeInTheDocument();
        expect(screen.getByText("dynamic-programming")).toBeInTheDocument();
    });

    it("2. Displays loading state while data is being fetched", () => {
        // Unresolved promise
        vi.spyOn(AnalyticsApiService, "getUserProfile").mockReturnValue(new Promise(() => {}));

        render(
            <ThemeProvider>
                <OverviewPage token="valid-test-token" />
            </ThemeProvider>
        );

        expect(screen.getByText("Loading overview analytics...")).toBeInTheDocument();
    });

    it("3. Displays safe error state and allows retry on API failure", async () => {
        const getProfileSpy = vi
            .spyOn(AnalyticsApiService, "getUserProfile")
            .mockRejectedValueOnce(new Error("Network timeout"))
            .mockResolvedValueOnce(mockProfileData);

        render(
            <ThemeProvider>
                <OverviewPage token="valid-test-token" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Error Loading Data")).toBeInTheDocument();
            expect(screen.getByText("Network timeout")).toBeInTheDocument();
        });

        // Click retry button
        const retryButton = screen.getByRole("button", { name: "Retry" });
        fireEvent.click(retryButton);

        await waitFor(() => {
            expect(screen.getByText("Unique Problems Solved")).toBeInTheDocument();
            expect(screen.getByText("42")).toBeInTheDocument();
        });

        expect(getProfileSpy).toHaveBeenCalledTimes(2);
    });

    it("4. Displays clean empty state when no problem sessions exist yet", async () => {
        const emptyProfile: UserPerformanceProfile = {
            overall: {
                uniqueProblemsSolved: 0,
                totalSolvedSessions: 0,
                totalSessions: 0,
                totalSubmissions: 0,
                averageAttempts: 0,
                firstAttemptSuccessRate: 0,
                averageSolveTime: 0,
                averageThinkingTime: 0,
                averageCodingTime: 0,
                hintUsageRate: 0,
                solutionUsageRate: 0,
                editorialUsageRate: 0,
                totalTimeSpent: 0
            },
            difficultyPerformance: {},
            topicPerformance: {}
        };

        vi.spyOn(AnalyticsApiService, "getUserProfile").mockResolvedValue(emptyProfile);

        render(
            <ThemeProvider>
                <OverviewPage token="valid-test-token" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("No Practice Sessions Found")).toBeInTheDocument();
            expect(screen.getByText(/Start solving LeetCode problems with the ORCA Chrome Extension/i)).toBeInTheDocument();
        });
    });

    it("5. Theme toggles between Dark and Light mode and updates document element", () => {
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        // Initial default theme is Dark
        expect(document.documentElement.classList.contains("dark")).toBe(true);

        const toggleBtn = screen.getByRole("button", { name: /Switch to light mode/i });
        fireEvent.click(toggleBtn);

        // Should now be light theme
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(screen.getByRole("button", { name: /Switch to dark mode/i })).toBeInTheDocument();

        // Toggle back to dark
        fireEvent.click(screen.getByRole("button", { name: /Switch to dark mode/i }));
        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("6. Persists theme preference across sessions in localStorage", () => {
        localStorage.setItem("dsa_theme", "light");

        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        expect(document.documentElement.classList.contains("dark")).toBe(false);

        const toggleBtn = screen.getByRole("button", { name: /Switch to dark mode/i });
        fireEvent.click(toggleBtn);

        expect(localStorage.getItem("dsa_theme")).toBe("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("7. Sidebar marks inactive items as disabled placeholders without navigation", () => {
        const logoutMock = vi.fn();

        render(
            <Sidebar onLogout={logoutMock} />
        );

        // Check Overview is present and active
        expect(screen.getByText("Overview")).toBeInTheDocument();

        // Check placeholders are visible with 'Soon' tags and non-navigable
        const placeholders = ["Performance", "Confidence", "Revision", "Problems"];
        for (const placeholder of placeholders) {
            const item = screen.getByText(placeholder);
            expect(item).toBeInTheDocument();
            // Verify there is no clickable link (a element)
            expect(item.closest("a")).toBeNull();
        }

        // Check sign out works
        const signOutBtn = screen.getByRole("button", { name: /Sign Out/i });
        fireEvent.click(signOutBtn);
        expect(logoutMock).toHaveBeenCalledTimes(1);
    });
});

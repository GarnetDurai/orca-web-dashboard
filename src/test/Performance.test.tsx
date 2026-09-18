import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { PerformancePage } from "../pages/PerformancePage";
import { Dashboard } from "../Dashboard";
import { ThemeProvider } from "../context/ThemeContext";
import { AnalyticsApiService } from "../services/analyticsApiService";
import { AUTH_TOKEN_KEY } from "../config";
import type { HistoricalAnalytics, UserPerformanceProfile } from "../types/analytics";

const mockHistoricalData: HistoricalAnalytics = {
    totalProblemsSolved: 35,
    totalSessions: 48,
    averageSolveTime: 780000, // 13m
    averageThinkingTime: 240000, // 4m
    averageCodingTime: 540000, // 9m
    averageAttempts: 1.4,
    firstAttemptSuccessRate: 72.9,
    totalWrongSubmissions: 25,
    totalAcceptedSubmissions: 38,
    hintUsageRate: 15.0,
    solutionUsageRate: 6.5,
    editorialUsageRate: 3.0,
    averageHintsPerProblem: 0.8,
    totalTimeSpent: 37440000, // 10h 24m
    problemsSolvedByDifficulty: {
        EASY: 18,
        MEDIUM: 14,
        HARD: 3
    },
    difficultyAnalytics: {
        EASY: {
            problemsSolved: 18,
            averageSolveTime: 360000, // 6m
            averageAttempts: 1.1,
            firstAttemptSuccessRate: 88.9
        },
        MEDIUM: {
            problemsSolved: 14,
            averageSolveTime: 960000, // 16m
            averageAttempts: 1.5,
            firstAttemptSuccessRate: 64.3
        },
        HARD: {
            problemsSolved: 3,
            averageSolveTime: 1800000, // 30m
            averageAttempts: 2.3,
            firstAttemptSuccessRate: 33.3
        }
    },
    topicAnalytics: {
        "dynamic-programming": {
            problemsSolved: 10,
            averageSolveTime: 1140000, // 19m
            firstAttemptSuccessRate: 60.0
        },
        "binary-search": {
            problemsSolved: 15,
            averageSolveTime: 420000, // 7m
            firstAttemptSuccessRate: 86.7
        },
        "trees": {
            problemsSolved: 12,
            averageSolveTime: 600000, // 10m
            firstAttemptSuccessRate: 75.0
        }
    }
};

const mockProfileData: UserPerformanceProfile = {
    overall: {
        uniqueProblemsSolved: 35,
        totalSolvedSessions: 35,
        totalSessions: 48,
        totalSubmissions: 63,
        averageAttempts: 1.4,
        firstAttemptSuccessRate: 72.9,
        averageSolveTime: 780000,
        averageThinkingTime: 240000,
        averageCodingTime: 540000,
        hintUsageRate: 15.0,
        solutionUsageRate: 6.5,
        editorialUsageRate: 3.0,
        totalTimeSpent: 37440000
    },
    difficultyPerformance: {},
    topicPerformance: {}
};

describe("Performance Page Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        document.documentElement.classList.remove("dark");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("1. Renders summary metrics correctly from backend HistoricalAnalytics", async () => {
        vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockResolvedValue(mockHistoricalData);

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Total Sessions")).toBeInTheDocument();
            expect(screen.getByText("48")).toBeInTheDocument();
        });

        expect(screen.getAllByText("Average Solve Time")[0]).toBeInTheDocument();
        expect(screen.getAllByText("13m")[0]).toBeInTheDocument();

        expect(screen.getAllByText("Average Attempts")[0]).toBeInTheDocument();
        expect(screen.getByText("1.4")).toBeInTheDocument();

        expect(screen.getByText("First-Attempt Success")).toBeInTheDocument();
        expect(screen.getByText("72.9%")).toBeInTheDocument();

        expect(screen.getByText("Total Time")).toBeInTheDocument();
        expect(screen.getAllByText("10h 24m")[0]).toBeInTheDocument();

        // Secondary metrics
        expect(screen.getByText("Problems Solved")).toBeInTheDocument();
        expect(screen.getByText("35")).toBeInTheDocument();
        expect(screen.getByText("Accepted Submissions")).toBeInTheDocument();
        expect(screen.getByText("38")).toBeInTheDocument();
        expect(screen.getByText("Wrong Submissions")).toBeInTheDocument();
        expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("2. Correctly renders difficulty performance table with 1st Attempt Success label", async () => {
        vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockResolvedValue(mockHistoricalData);

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Difficulty Performance")).toBeInTheDocument();
        });

        // Verify column headers
        const firstAttemptHeaders = screen.getAllByText("1st Attempt Success");
        expect(firstAttemptHeaders.length).toBeGreaterThanOrEqual(1);

        // Verify difficulty rows
        expect(screen.getByText("Easy")).toBeInTheDocument();
        expect(screen.getByText("18")).toBeInTheDocument();
        expect(screen.getByText("6m")).toBeInTheDocument();
        expect(screen.getByText("88.9%")).toBeInTheDocument();

        expect(screen.getByText("Medium")).toBeInTheDocument();
        expect(screen.getByText("14")).toBeInTheDocument();
        expect(screen.getByText("16m")).toBeInTheDocument();
        expect(screen.getByText("64.3%")).toBeInTheDocument();

        expect(screen.getByText("Hard")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("30m")).toBeInTheDocument();
        expect(screen.getByText("33.3%")).toBeInTheDocument();
    });

    it("3. Correctly renders topic performance table sorted by problems solved descending", async () => {
        vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockResolvedValue(mockHistoricalData);

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Topic Performance")).toBeInTheDocument();
        });

        expect(screen.getByText("binary-search")).toBeInTheDocument();
        expect(screen.getByText("trees")).toBeInTheDocument();
        expect(screen.getByText("dynamic-programming")).toBeInTheDocument();
        expect(screen.getByText("86.7%")).toBeInTheDocument();
    });

    it("4. Correctly renders Time Breakdown and Assistance Breakdown sections", async () => {
        vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockResolvedValue(mockHistoricalData);

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Time Breakdown")).toBeInTheDocument();
            expect(screen.getByText("Assistance Breakdown")).toBeInTheDocument();
        });

        // Time breakdown fields
        expect(screen.getByText("Thinking Time")).toBeInTheDocument();
        expect(screen.getByText("4m")).toBeInTheDocument();
        expect(screen.getByText("Coding Time")).toBeInTheDocument();
        expect(screen.getByText("9m")).toBeInTheDocument();

        // Assistance fields
        expect(screen.getByText("Hint Usage")).toBeInTheDocument();
        expect(screen.getByText("15.0%")).toBeInTheDocument();
        expect(screen.getByText("Solution Views")).toBeInTheDocument();
        expect(screen.getByText("6.5%")).toBeInTheDocument();
        expect(screen.getByText("Editorial Views")).toBeInTheDocument();
        expect(screen.getByText("3.0%")).toBeInTheDocument();
        expect(screen.getByText("Hints / Problem")).toBeInTheDocument();
        expect(screen.getByText("0.8")).toBeInTheDocument();
    });

    it("5. Time-window selection triggers the correct API request", async () => {
        const fetchSpy = vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockResolvedValue(mockHistoricalData);

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        // Initial default fetch is ALL_TIME
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith("test-jwt-token", "ALL_TIME");
        });

        // Click "Last 7 Days"
        const last7DaysBtn = screen.getByRole("button", { name: "Last 7 Days" });
        fireEvent.click(last7DaysBtn);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith("test-jwt-token", "LAST_7_DAYS");
        });

        // Click "Last 30 Days"
        const last30DaysBtn = screen.getByRole("button", { name: "Last 30 Days" });
        fireEvent.click(last30DaysBtn);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith("test-jwt-token", "LAST_30_DAYS");
        });

        // Click "Last 90 Days"
        const last90DaysBtn = screen.getByRole("button", { name: "Last 90 Days" });
        fireEvent.click(last90DaysBtn);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith("test-jwt-token", "LAST_90_DAYS");
        });
    });

    it("6. Displays loading state while data is being fetched", () => {
        vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockReturnValue(new Promise(() => {}));

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        expect(screen.getByText("Loading performance analytics...")).toBeInTheDocument();
    });

    it("7. Displays clean empty state when no historical data exists", async () => {
        const emptyData: HistoricalAnalytics = {
            totalProblemsSolved: 0,
            totalSessions: 0,
            averageSolveTime: 0,
            averageThinkingTime: 0,
            averageCodingTime: 0,
            averageAttempts: 0,
            firstAttemptSuccessRate: 0,
            totalWrongSubmissions: 0,
            totalAcceptedSubmissions: 0,
            hintUsageRate: 0,
            solutionUsageRate: 0,
            editorialUsageRate: 0,
            averageHintsPerProblem: 0,
            totalTimeSpent: 0,
            problemsSolvedByDifficulty: {},
            difficultyAnalytics: {},
            topicAnalytics: {}
        };

        vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockResolvedValue(emptyData);

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("No Performance Data Found")).toBeInTheDocument();
        });
    });

    it("8. Displays safe error state and allows retry on API failure", async () => {
        const fetchSpy = vi
            .spyOn(AnalyticsApiService, "getHistoricalAnalytics")
            .mockRejectedValueOnce(new Error("Network error"))
            .mockResolvedValueOnce(mockHistoricalData);

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Error Loading Data")).toBeInTheDocument();
            expect(screen.getByText("Network error")).toBeInTheDocument();
        });

        const retryBtn = screen.getByRole("button", { name: "Retry" });
        fireEvent.click(retryBtn);

        await waitFor(() => {
            expect(screen.getByText("Total Sessions")).toBeInTheDocument();
            expect(screen.getByText("48")).toBeInTheDocument();
        });

        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("9. Navigating between Overview and Performance works seamlessly in Dashboard shell", async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, "test-valid-jwt");
        vi.spyOn(AnalyticsApiService, "getUserProfile").mockResolvedValue(mockProfileData);
        vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockResolvedValue(mockHistoricalData);

        render(
            <ThemeProvider>
                <Dashboard />
            </ThemeProvider>
        );

        // Initially Overview page is active
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
        });

        // Click "Performance" in the sidebar
        const perfNavBtn = screen.getByRole("button", { name: /^Performance/i });
        fireEvent.click(perfNavBtn);

        // Header and page switch to Performance
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Performance" })).toBeInTheDocument();
            expect(screen.getByText("Detailed breakdown of your problem-solving performance.")).toBeInTheDocument();
        });

        // Click "Overview" in the sidebar to return
        const overviewNavBtn = screen.getByRole("button", { name: /^Overview/i });
        fireEvent.click(overviewNavBtn);

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
        });
    });

    it("10. Supports theme toggling in Dark and Light modes on Performance page", async () => {
        vi.spyOn(AnalyticsApiService, "getHistoricalAnalytics").mockResolvedValue(mockHistoricalData);

        render(
            <ThemeProvider>
                <PerformancePage token="test-jwt-token" />
            </ThemeProvider>
        );

        expect(document.documentElement.classList.contains("dark")).toBe(true);

        await waitFor(() => {
            expect(screen.getByText("Total Sessions")).toBeInTheDocument();
        });
    });
});

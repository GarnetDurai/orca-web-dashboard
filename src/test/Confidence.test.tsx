import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ConfidencePage } from "../pages/ConfidencePage";
import { Dashboard } from "../Dashboard";
import { ThemeProvider } from "../context/ThemeContext";
import { DashboardApiClient } from "../services/apiClient";
import { AUTH_TOKEN_KEY } from "../config";
import type { ConfidenceResponse } from "../types/confidence";

const mockConfidenceData: ConfidenceResponse[] = [
    {
        problemId: 1,
        leetcodeId: 1,
        problemTitle: "Two Sum",
        difficulty: "EASY",
        currentConfidence: 85.5,
        masteryScore: 100.0,
        independenceScore: 100.0,
        retentionStrength: 40.0,
        successfulSolveCount: 2,
        independentSolveCount: 2,
        lastSuccessfulSolveAt: "2026-09-20T10:15:30",
        lastConfidenceUpdateAt: "2026-09-20T10:15:30",
        algorithmVersion: "V1",
        history: [
            {
                id: 101,
                timestamp: "2026-09-20T10:15:30",
                previousConfidence: 0.0,
                newConfidence: 85.5,
                masteryContribution: 100.0,
                independenceContribution: 100.0,
                retentionContribution: 30.0,
                assistanceEffect: "NO_ASSISTANCE",
                awayTimeEffect: 0.0,
                algorithmVersion: "V1"
            }
        ]
    },
    {
        problemId: 2,
        leetcodeId: 2,
        problemTitle: "Add Two Numbers",
        difficulty: "MEDIUM",
        currentConfidence: 55.0,
        masteryScore: 85.0,
        independenceScore: 70.0,
        retentionStrength: 15.0,
        successfulSolveCount: 1,
        independentSolveCount: 0,
        lastSuccessfulSolveAt: "2026-09-21T14:30:00",
        lastConfidenceUpdateAt: "2026-09-21T14:30:00",
        algorithmVersion: "V1",
        history: [
            {
                id: 102,
                timestamp: "2026-09-21T14:30:00",
                previousConfidence: 0.0,
                newConfidence: 55.0,
                masteryContribution: 85.0,
                independenceContribution: 70.0,
                retentionContribution: 15.0,
                assistanceEffect: "VIEWED_HINTS",
                awayTimeEffect: -2.0,
                algorithmVersion: "V1"
            }
        ]
    },
    {
        problemId: 3,
        leetcodeId: 4,
        problemTitle: "Median of Two Sorted Arrays",
        difficulty: "HARD",
        currentConfidence: 25.0,
        masteryScore: 50.0,
        independenceScore: 30.0,
        retentionStrength: 5.0,
        successfulSolveCount: 1,
        independentSolveCount: 0,
        lastSuccessfulSolveAt: "2026-09-22T09:00:00",
        lastConfidenceUpdateAt: "2026-09-22T09:00:00",
        algorithmVersion: "V1",
        history: []
    }
];

describe("Confidence V1 Page & API Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("1. Loads confidence data successfully and displays table rows", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockConfidenceData
        } as Response);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        // Loading indicator initially
        expect(screen.getByText("Loading confidence data...")).toBeInTheDocument();

        // Wait for table to load
        await waitFor(() => {
            expect(screen.getByText("Two Sum")).toBeInTheDocument();
            expect(screen.getByText("Add Two Numbers")).toBeInTheDocument();
            expect(screen.getByText("Median of Two Sorted Arrays")).toBeInTheDocument();
        });

        // Verify difficulty labels
        expect(screen.getByText("EASY")).toBeInTheDocument();
        expect(screen.getByText("MEDIUM")).toBeInTheDocument();
        expect(screen.getByText("HARD")).toBeInTheDocument();
    });

    it("2. Displays backend-provided currentConfidence values with restrained numeric presentation", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockConfidenceData
        } as Response);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("85.5 / 100")).toBeInTheDocument();
            expect(screen.getByText("55.0 / 100")).toBeInTheDocument();
            expect(screen.getByText("25.0 / 100")).toBeInTheDocument();
        });
    });

    it("3. Displays mastery, independence, and retention values from the API", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockConfidenceData
        } as Response);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Two Sum")).toBeInTheDocument();
        });

        // Two Sum has 100.0% mastery and independence, 40.0% retention
        expect(screen.getAllByText("100.0%").length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText("40.0%")).toBeInTheDocument();
        expect(screen.getByText("85.0%")).toBeInTheDocument();
        expect(screen.getByText("70.0%")).toBeInTheDocument();
        expect(screen.getByText("15.0%")).toBeInTheDocument();
    });

    it("4. Calculates and displays Overall Confidence only as the arithmetic mean of returned currentConfidence values", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockConfidenceData
        } as Response);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        // Expected mean: (85.5 + 55.0 + 25.0) / 3 = 165.5 / 3 = 55.1666... => 55.2 / 100
        await waitFor(() => {
            expect(screen.getByText("55.2 / 100")).toBeInTheDocument();
        });

        // Verify summary stat card values
        expect(screen.getByText("Problems With Confidence")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument(); // 3 records
        expect(screen.getByText("Independent Solves")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument(); // 2 + 0 + 0 = 2
        expect(screen.getByText("Successful Solves")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument(); // 2 + 1 + 1 = 4
    });

    it("5. Displays empty state when no confidence records exist", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => []
        } as Response);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("No Confidence Data Found")).toBeInTheDocument();
            expect(
                screen.getByText(/Confidence is generated from successfully solved problems/i)
            ).toBeInTheDocument();
        });

        expect(screen.queryByText("Overall Confidence")).not.toBeInTheDocument();
    });

    it("6. Displays loading state while fetch is in progress", async () => {
        let resolvePromise!: (val: Response) => void;
        const pendingPromise = new Promise<Response>((resolve) => {
            resolvePromise = resolve;
        });

        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockReturnValue(pendingPromise);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        expect(screen.getByText("Loading confidence data...")).toBeInTheDocument();

        resolvePromise({
            ok: true,
            status: 200,
            json: async () => []
        } as Response);

        await waitFor(() => {
            expect(screen.queryByText("Loading confidence data...")).not.toBeInTheDocument();
        });
    });

    it("7. Displays API failure state with retry button", async () => {
        const fetchSpy = vi.spyOn(DashboardApiClient, "authenticatedFetch")
            .mockRejectedValueOnce(new Error("Network connection lost"))
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockConfidenceData
            } as Response);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Network connection lost")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
        });

        // Click retry
        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        await waitFor(() => {
            expect(screen.getByText("Two Sum")).toBeInTheDocument();
        });

        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("8. Verifies DashboardApiClient.authenticatedFetch is used rather than raw unauthenticated fetch", async () => {
        const authFetchSpy = vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockConfidenceData
        } as Response);

        const rawFetchSpy = vi.spyOn(globalThis, "fetch");

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(authFetchSpy).toHaveBeenCalledTimes(1);
            expect(authFetchSpy).toHaveBeenCalledWith(
                "http://localhost:8080/analytics/confidence",
                expect.objectContaining({
                    method: "GET"
                })
            );
        });

        // Global unauthenticated fetch must not have been called for confidence
        expect(rawFetchSpy).not.toHaveBeenCalledWith(
            expect.stringContaining("/analytics/confidence"),
            expect.anything()
        );
    });

    it("9. Selecting a problem row uses already-loaded record and displays its history", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockConfidenceData
        } as Response);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Two Sum")).toBeInTheDocument();
        });

        // Detail card initially not rendered
        expect(screen.queryByText(/Problem Detail: #1 Two Sum/i)).not.toBeInTheDocument();

        // Click Two Sum row
        const row = screen.getByText("Two Sum").closest("tr");
        expect(row).toBeInTheDocument();
        fireEvent.click(row!);

        // Detail card and history should appear
        await waitFor(() => {
            expect(screen.getByText(/Problem Detail: #1 Two Sum/i)).toBeInTheDocument();
            expect(screen.getByText("Confidence Evidence History")).toBeInTheDocument();
            expect(screen.getByText("0.0 → 85.5")).toBeInTheDocument();
            expect(screen.getByText("No Assistance")).toBeInTheDocument();
        });
    });

    it("10. Selecting a problem does NOT trigger another network request", async () => {
        const authFetchSpy = vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockConfidenceData
        } as Response);

        render(
            <ThemeProvider>
                <ConfidencePage />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Two Sum")).toBeInTheDocument();
        });

        expect(authFetchSpy).toHaveBeenCalledTimes(1);

        // Click row 1: Two Sum
        fireEvent.click(screen.getByText("Two Sum").closest("tr")!);
        expect(screen.getByText(/Problem Detail: #1 Two Sum/i)).toBeInTheDocument();

        // Click row 2: Add Two Numbers
        fireEvent.click(screen.getByText("Add Two Numbers").closest("tr")!);
        expect(screen.getByText(/Problem Detail: #2 Add Two Numbers/i)).toBeInTheDocument();

        // Network call count must remain strictly 1
        expect(authFetchSpy).toHaveBeenCalledTimes(1);
    });

    it("11. Confidence tab navigation works in Dashboard shell", async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, "test-valid-jwt");

        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockConfidenceData
        } as Response);

        render(
            <ThemeProvider>
                <Dashboard />
            </ThemeProvider>
        );

        // Initially on Overview
        expect(screen.getByRole("button", { name: "Confidence" })).toBeInTheDocument();

        // Navigate to Confidence tab
        fireEvent.click(screen.getByRole("button", { name: "Confidence" }));

        await waitFor(() => {
            expect(
                screen.getByText(
                    "Problem-level confidence based on solving, independence, and retention evidence."
                )
            ).toBeInTheDocument();
            expect(screen.getByText("Two Sum")).toBeInTheDocument();
        });
    });
});

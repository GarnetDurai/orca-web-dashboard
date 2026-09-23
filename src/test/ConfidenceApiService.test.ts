import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConfidenceApiService } from "../services/confidenceApiService";
import { DashboardApiClient } from "../services/apiClient";
import type { ConfidenceResponse } from "../types/confidence";

describe("ConfidenceApiService Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAllConfidence calls /analytics/confidence and returns JSON array on 200 OK", async () => {
        const mockData: Partial<ConfidenceResponse>[] = [
            { problemId: 1, problemTitle: "Two Sum", currentConfidence: 85.5 }
        ];

        const authFetchSpy = vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockData
        } as Response);

        const result = await ConfidenceApiService.getAllConfidence();

        expect(authFetchSpy).toHaveBeenCalledTimes(1);
        expect(authFetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/analytics/confidence",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        expect(result).toEqual(mockData);
    });

    it("getAllConfidence throws 'Session expired. Please re-authenticate.' on 401", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({})
        } as Response);

        await expect(ConfidenceApiService.getAllConfidence()).rejects.toThrow(
            "Session expired. Please re-authenticate."
        );
    });

    it("getAllConfidence throws generic error on 500", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({})
        } as Response);

        await expect(ConfidenceApiService.getAllConfidence()).rejects.toThrow(
            "Failed to load confidence records (HTTP 500)."
        );
    });

    it("getConfidenceForProblem calls /analytics/confidence/{problemId} and returns JSON on 200 OK", async () => {
        const mockProblem: Partial<ConfidenceResponse> = {
            problemId: 42,
            problemTitle: "Trapping Rain Water",
            currentConfidence: 75.0
        };

        const authFetchSpy = vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockProblem
        } as Response);

        const result = await ConfidenceApiService.getConfidenceForProblem(42);

        expect(authFetchSpy).toHaveBeenCalledTimes(1);
        expect(authFetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/analytics/confidence/42",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        expect(result).toEqual(mockProblem);
    });

    it("getConfidenceForProblem throws clear error on 404", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({})
        } as Response);

        await expect(ConfidenceApiService.getConfidenceForProblem(999)).rejects.toThrow(
            "Failed to load confidence for problem 999 (HTTP 404)."
        );
    });
});

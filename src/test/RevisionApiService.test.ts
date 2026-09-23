import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RevisionApiService } from "../services/revisionApiService";
import { DashboardApiClient } from "../services/apiClient";
import type { ReviewQueueResponse, RevisionState } from "../types/revision";

describe("RevisionApiService Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getTodayReviewQueue calls /analytics/revisions/today with timeZone and returns JSON on 200 OK", async () => {
        const mockQueueResponse: Partial<ReviewQueueResponse> = {
            totalDue: 2,
            dailyCapacity: 4,
            reviewsCompletedToday: 1,
            newProblemsSolvedToday: 2,
            queue: []
        };

        const authFetchSpy = vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockQueueResponse
        } as Response);

        const result = await RevisionApiService.getTodayReviewQueue("America/New_York");

        expect(authFetchSpy).toHaveBeenCalledTimes(1);
        expect(authFetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/analytics/revisions/today?timeZone=America%2FNew_York",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        expect(result).toEqual(mockQueueResponse);
    });

    it("getTodayReviewQueue throws 'Session expired. Please re-authenticate.' on 401", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({})
        } as Response);

        await expect(RevisionApiService.getTodayReviewQueue()).rejects.toThrow(
            "Session expired. Please re-authenticate."
        );
    });

    it("getTodayReviewQueue throws generic error on 500", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({})
        } as Response);

        await expect(RevisionApiService.getTodayReviewQueue()).rejects.toThrow(
            "Failed to load today's review queue (HTTP 500)."
        );
    });

    it("getAllRevisions calls /analytics/revisions and returns JSON on 200 OK", async () => {
        const mockList: Partial<RevisionState>[] = [
            { problemId: 1, problemTitle: "Two Sum", reviewCount: 2 }
        ];

        const authFetchSpy = vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockList
        } as Response);

        const result = await RevisionApiService.getAllRevisions();

        expect(authFetchSpy).toHaveBeenCalledTimes(1);
        expect(authFetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/analytics/revisions",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        expect(result).toEqual(mockList);
    });

    it("getRevisionForProblem calls /analytics/revisions/{problemId} and returns JSON on 200 OK", async () => {
        const mockDetail: Partial<RevisionState> = {
            problemId: 42,
            problemTitle: "Trapping Rain Water",
            currentIntervalDays: 6,
            history: []
        };

        const authFetchSpy = vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockDetail
        } as Response);

        const result = await RevisionApiService.getRevisionForProblem(42);

        expect(authFetchSpy).toHaveBeenCalledTimes(1);
        expect(authFetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/analytics/revisions/42",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        expect(result).toEqual(mockDetail);
    });

    it("getRevisionForProblem throws error on 404", async () => {
        vi.spyOn(DashboardApiClient, "authenticatedFetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({})
        } as Response);

        await expect(RevisionApiService.getRevisionForProblem(999)).rejects.toThrow(
            "Failed to load revision for problem 999 (HTTP 404)."
        );
    });
});

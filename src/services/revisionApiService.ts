import { BACKEND_URL } from "../config";
import { DashboardApiClient } from "./apiClient";
import type { ReviewQueueResponse, RevisionState } from "../types/revision";

export class RevisionApiService {
    /**
     * Fetches today's prioritized review queue from GET /analytics/revisions/today
     */
    public static async getTodayReviewQueue(timeZone?: string): Promise<ReviewQueueResponse> {
        const tz = timeZone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined);
        const query = tz ? `?timeZone=${encodeURIComponent(tz)}` : "";
        const response = await DashboardApiClient.authenticatedFetch(
            `${BACKEND_URL}/analytics/revisions/today${query}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Session expired. Please re-authenticate.");
            }
            throw new Error(`Failed to load today's review queue (HTTP ${response.status}).`);
        }

        return response.json();
    }

    /**
     * Fetches all scheduled revision states for the user from GET /analytics/revisions
     */
    public static async getAllRevisions(): Promise<RevisionState[]> {
        const response = await DashboardApiClient.authenticatedFetch(`${BACKEND_URL}/analytics/revisions`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Session expired. Please re-authenticate.");
            }
            throw new Error(`Failed to load revisions (HTTP ${response.status}).`);
        }

        return response.json();
    }

    /**
     * Fetches revision state and full review history for a specific problem from GET /analytics/revisions/{problemId}
     */
    public static async getRevisionForProblem(problemId: number): Promise<RevisionState> {
        const response = await DashboardApiClient.authenticatedFetch(
            `${BACKEND_URL}/analytics/revisions/${encodeURIComponent(problemId)}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Session expired. Please re-authenticate.");
            }
            throw new Error(`Failed to load revision for problem ${problemId} (HTTP ${response.status}).`);
        }

        return response.json();
    }
}

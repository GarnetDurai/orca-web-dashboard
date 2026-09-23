import { BACKEND_URL } from "../config";
import { DashboardApiClient } from "./apiClient";
import type { ConfidenceResponse } from "../types/confidence";

export class ConfidenceApiService {
    /**
     * Fetches all confidence records for the authenticated user from GET /analytics/confidence
     */
    public static async getAllConfidence(): Promise<ConfidenceResponse[]> {
        const response = await DashboardApiClient.authenticatedFetch(`${BACKEND_URL}/analytics/confidence`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Session expired. Please re-authenticate.");
            }
            throw new Error(`Failed to load confidence records (HTTP ${response.status}).`);
        }

        return response.json();
    }

    /**
     * Fetches confidence data and history for a specific problem from GET /analytics/confidence/{problemId}
     * Retained for future problem-specific navigation/inspection.
     */
    public static async getConfidenceForProblem(problemId: number): Promise<ConfidenceResponse> {
        const response = await DashboardApiClient.authenticatedFetch(
            `${BACKEND_URL}/analytics/confidence/${encodeURIComponent(problemId)}`,
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
            throw new Error(`Failed to load confidence for problem ${problemId} (HTTP ${response.status}).`);
        }

        return response.json();
    }
}

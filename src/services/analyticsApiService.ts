import { BACKEND_URL } from "../config";
import { DashboardApiClient } from "./apiClient";
import type { HistoricalAnalytics, TimeWindow, UserPerformanceProfile } from "../types/analytics";

export class AnalyticsApiService {
    /**
     * Fetches user performance profile from GET /analytics/profile
     */
    public static async getUserProfile(token?: string): Promise<UserPerformanceProfile> {
        const response = await DashboardApiClient.authenticatedFetch(`${BACKEND_URL}/analytics/profile`, {
            method: "GET",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Session expired. Please re-authenticate.");
            }
            throw new Error(`Failed to load profile metrics (HTTP ${response.status}).`);
        }

        return response.json();
    }

    /**
     * Fetches historical analytics from GET /analytics/historical
     */
    public static async getHistoricalAnalytics(
        token?: string,
        timeWindow: TimeWindow = "ALL_TIME"
    ): Promise<HistoricalAnalytics> {
        const url = new URL(`${BACKEND_URL}/analytics/historical`);
        if (timeWindow) {
            url.searchParams.set("timeWindow", timeWindow);
        }

        const response = await DashboardApiClient.authenticatedFetch(url.toString(), {
            method: "GET",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Session expired. Please re-authenticate.");
            }
            throw new Error(`Failed to load historical analytics (HTTP ${response.status}).`);
        }

        return response.json();
    }
}

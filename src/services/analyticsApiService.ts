import { BACKEND_URL } from "../config";
import type { HistoricalAnalytics, UserPerformanceProfile } from "../types/analytics";

export class AnalyticsApiService {
    /**
     * Fetches user performance profile from GET /analytics/profile
     */
    public static async getUserProfile(token: string): Promise<UserPerformanceProfile> {
        if (!token) {
            throw new Error("Authentication token is missing.");
        }

        const response = await fetch(`${BACKEND_URL}/analytics/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
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
    public static async getHistoricalAnalytics(token: string): Promise<HistoricalAnalytics> {
        if (!token) {
            throw new Error("Authentication token is missing.");
        }

        const response = await fetch(`${BACKEND_URL}/analytics/historical`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
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

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DashboardApiClient } from "../services/apiClient";
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, BACKEND_URL } from "../config";

describe("DashboardApiClient & Token Lifecycle", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("1. authenticatedFetch succeeds with existing valid access token", async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, "valid-access-jwt");

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: "ok" })
        });

        const res = await DashboardApiClient.authenticatedFetch(`${BACKEND_URL}/analytics/profile`);
        expect(res.ok).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
            `${BACKEND_URL}/analytics/profile`,
            expect.objectContaining({
                headers: expect.any(Headers)
            })
        );
    });

    it("2. authenticatedFetch automatically refreshes token on 401 and retries with new access token", async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, "expired-access-jwt");
        localStorage.setItem(REFRESH_TOKEN_KEY, "valid-refresh-token");

        const fetchMock = vi.fn()
            // 1. First API call returns 401
            .mockResolvedValueOnce({
                ok: false,
                status: 401
            })
            // 2. /auth/refresh returns 200 with new rotated tokens
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    token: "rotated-access-jwt",
                    refreshToken: "rotated-refresh-token"
                })
            })
            // 3. Retried API call returns 200
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ profile: "data" })
            });

        global.fetch = fetchMock;

        const res = await DashboardApiClient.authenticatedFetch(`${BACKEND_URL}/analytics/profile`);
        expect(res.ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(3);

        // Verify localStorage was updated with rotated tokens
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("rotated-access-jwt");
        expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("rotated-refresh-token");
    });

    it("3. Invalid refresh token (401/400) clears credentials and emits auth-invalidated", async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, "expired-access-jwt");
        localStorage.setItem(REFRESH_TOKEN_KEY, "revoked-refresh-token");

        let eventFired = false;
        window.addEventListener("auth-invalidated", () => {
            eventFired = true;
        });

        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401
        });

        const res = await DashboardApiClient.refreshAccessToken();

        expect(res).toBeNull();
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
        expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
        expect(eventFired).toBe(true);
    });

    it("4. Temporary network or 5xx failure during refresh preserves refresh token", async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, "expired-access-jwt");
        localStorage.setItem(REFRESH_TOKEN_KEY, "valid-refresh-token");

        global.fetch = vi.fn().mockRejectedValue(new Error("Network connection lost"));

        const res = await DashboardApiClient.refreshAccessToken();

        expect(res).toBeNull();
        // Refresh token must NOT be purged
        expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("valid-refresh-token");
    });

    it("5. Single-flight refresh lock: concurrent requests share the same refresh call", async () => {
        localStorage.setItem(REFRESH_TOKEN_KEY, "refresh-token-single-flight");

        let refreshFetchCalls = 0;
        global.fetch = vi.fn().mockImplementation(async (url: string) => {
            if (url.includes("/auth/refresh")) {
                refreshFetchCalls++;
                await new Promise((r) => setTimeout(r, 20));
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ token: "coalesced-jwt", refreshToken: "rotated-ref" })
                };
            }
            return { status: 404 };
        });

        const [t1, t2] = await Promise.all([
            DashboardApiClient.refreshAccessToken(),
            DashboardApiClient.refreshAccessToken()
        ]);

        expect(refreshFetchCalls).toBe(1);
        expect(t1).toBe("coalesced-jwt");
        expect(t2).toBe("coalesced-jwt");
    });
});

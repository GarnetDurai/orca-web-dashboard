import { AUTH_TOKEN_KEY, BACKEND_URL, REFRESH_TOKEN_KEY } from "../config";

export class DashboardApiClient {
    private static activeRefreshPromise: Promise<string | null> | null = null;

    /**
     * Refreshes the short-lived access token using the stored refresh token.
     * Synchronous assignment to activeRefreshPromise ensures strict single-flight execution.
     */
    public static async refreshAccessToken(): Promise<string | null> {
        if (this.activeRefreshPromise) {
            return this.activeRefreshPromise;
        }

        this.activeRefreshPromise = (async () => {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (!refreshToken) {
                return null;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ refreshToken })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.token) {
                        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                        if (data.refreshToken) {
                            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
                        }
                        return data.token as string;
                    }
                }

                // 401 or 400: Invalid, expired, or revoked refresh token -> clear credentials
                if (response.status === 401 || response.status === 400) {
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    localStorage.removeItem(REFRESH_TOKEN_KEY);
                    window.dispatchEvent(new Event("auth-invalidated"));
                    return null;
                }

                // Network / 5xx error: preserve existing refresh token
                return null;
            } catch {
                // Network failure / timeout: preserve credentials
                return null;
            } finally {
                this.activeRefreshPromise = null;
            }
        })();

        return this.activeRefreshPromise;
    }

    /**
     * Authenticated fetch that automatically refreshes the token on 401 and retries once.
     */
    public static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
        let token = localStorage.getItem(AUTH_TOKEN_KEY);
        const headers = new Headers(options.headers || {});
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        let response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
                headers.set("Authorization", `Bearer ${newToken}`);
                response = await fetch(url, { ...options, headers });
            }
        }

        return response;
    }
}

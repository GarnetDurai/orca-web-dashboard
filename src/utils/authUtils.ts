/**
 * Authentication utility functions.
 * Keeps JWT inspection and credentials handling decoupled from UI components.
 */

export function getUserEmailFromToken(token: string | null): string | null {
    if (!token) {
        return null;
    }

    try {
        const parts = token.split(".");
        if (parts.length < 2) {
            return null;
        }

        // Base64Url decode payload
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );

        const payload = JSON.parse(jsonPayload);
        return payload?.sub || payload?.email || null;
    } catch {
        return null;
    }
}

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Dashboard } from "../Dashboard";
import { AUTH_TOKEN_KEY } from "../config";

describe("Web Dashboard SSO Handoff V1 Tests", () => {
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Mock window.location
        delete (window as any).location;
        (window as any).location = new URL("http://localhost:5173/dashboard");
    });

    afterEach(() => {
        (window as any).location = originalLocation;
        vi.restoreAllMocks();
    });

    // 1. Code query parameter is detected and exchange endpoint is called exactly once
    it("1. Code query parameter is detected and exchange endpoint is called exactly once", async () => {
        (window as any).location = new URL("http://localhost:5173/dashboard?code=temp-valid-code-123");

        const replaceStateSpy = vi.spyOn(window.history, "replaceState");
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ token: "new-dashboard-jwt-token-777" })
        } as Response);

        render(<Dashboard />);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(fetchSpy).toHaveBeenCalledWith(
                "http://localhost:8080/auth/exchange-code",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: "temp-valid-code-123" })
                })
            );
        });

        // Verify token is stored
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("new-dashboard-jwt-token-777");

        // Verify URL is sanitized: code stripped from URL
        expect(replaceStateSpy).toHaveBeenCalledWith({}, document.title, "/dashboard");

        // Verify authenticated UI
        await waitFor(() => {
            expect(screen.getByText("Successfully authenticated via SSO handoff")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
        });
    });

    // 2. Failed exchange does not authenticate user and shows clear error message
    it("2. Failed exchange does not authenticate user and shows clear error message", async () => {
        (window as any).location = new URL("http://localhost:5173/dashboard?code=expired-or-invalid-code");

        const replaceStateSpy = vi.spyOn(window.history, "replaceState");
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({
                status: 401,
                message: "Invalid or expired authorization code"
            })
        } as Response);

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText("Invalid or expired authorization code")).toBeInTheDocument();
        });

        // User must NOT be in authenticated state
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
        expect(screen.queryByText("Successfully authenticated via SSO handoff")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Sign Out" })).not.toBeInTheDocument();
        // Must not replace URL on failure
        expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    // 3. Dashboard works normally without a code parameter when unauthenticated
    it("3. Dashboard works normally without a code parameter when unauthenticated", () => {
        (window as any).location = new URL("http://localhost:5173/dashboard");
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        render(<Dashboard />);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(screen.getByText("Welcome to DSA Tracker Web Dashboard.")).toBeInTheDocument();
        expect(screen.getByText(/Please sign in through the Chrome Extension/i)).toBeInTheDocument();
    });

    // 4. Dashboard works normally without a code parameter when already authenticated
    it("4. Dashboard works normally without a code parameter when already authenticated", () => {
        (window as any).location = new URL("http://localhost:5173/dashboard");
        localStorage.setItem(AUTH_TOKEN_KEY, "pre-existing-jwt-token");

        const fetchSpy = vi.spyOn(globalThis, "fetch");

        render(<Dashboard />);

        expect(fetchSpy).not.toHaveBeenCalledWith(
            expect.stringContaining("/auth/exchange-code"),
            expect.anything()
        );
        expect(screen.getByText("Successfully authenticated via SSO handoff")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
    });
});

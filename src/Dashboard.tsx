import React, { useEffect, useRef, useState } from "react";
import { AUTH_TOKEN_KEY, BACKEND_URL } from "./config";
import { DashboardLayout } from "./components/DashboardLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { getUserEmailFromToken } from "./utils/authUtils";

export const Dashboard: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [isExchanging, setIsExchanging] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Guard against React StrictMode duplicate execution
    const hasExchangedRef = useRef<boolean>(false);

    useEffect(() => {
        if (hasExchangedRef.current) {
            return;
        }

        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");

        if (code) {
            hasExchangedRef.current = true;
            setIsExchanging(true);
            setAuthError(null);

            // Exchange code with backend
            fetch(`${BACKEND_URL}/auth/exchange-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ code })
            })
                .then(async (res) => {
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => null);
                        throw new Error(
                            errorData?.message || "Authentication failed: invalid or expired authorization code."
                        );
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data && data.token) {
                        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                        setToken(data.token);

                        // Immediately sanitize URL: remove ?code= from address bar and history
                        const cleanPath = window.location.pathname || "/dashboard";
                        window.history.replaceState({}, document.title, cleanPath);
                    } else {
                        throw new Error("Invalid authentication response received.");
                    }
                })
                .catch((err: Error) => {
                    setAuthError(err.message || "Failed to exchange authorization code.");
                    setToken(null);
                })
                .finally(() => {
                    setIsExchanging(false);
                });
        } else {
            // No code query parameter: check existing stored authentication
            const existingToken = localStorage.getItem(AUTH_TOKEN_KEY);
            if (existingToken) {
                setToken(existingToken);
            }
        }
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setAuthError(null);
    };

    // If authenticated: render full Dashboard Shell + Overview Page
    if (!isExchanging && token) {
        const userEmail = getUserEmailFromToken(token);

        return (
            <DashboardLayout
                title="Overview"
                subtitle="Your DSA performance at a glance."
                userEmail={userEmail}
                onLogout={handleSignOut}
            >
                {/* Subtle SSO handoff confirmation badge */}
                <div className="mb-5 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Successfully authenticated via SSO handoff
                    </span>
                </div>

                <OverviewPage token={token} />
            </DashboardLayout>
        );
    }

    // Unauthenticated or Exchanging state
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-xl">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-xs bg-sky-500" />
                        <div>
                            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                                DSA Tracker
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Web Dashboard V1</p>
                        </div>
                    </div>
                </div>

                {isExchanging && (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <div className="w-7 h-7 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Authenticating with authorization code...
                        </p>
                    </div>
                )}

                {authError && !isExchanging && (
                    <div className="p-3 mb-4 text-xs text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg">
                        <div className="font-semibold mb-1">Authentication Error</div>
                        <div>{authError}</div>
                    </div>
                )}

                {!isExchanging && !authError && (
                    <div className="space-y-3 text-center py-6">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Welcome to DSA Tracker Web Dashboard.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Please sign in through the Chrome Extension and click &quot;Open Dashboard&quot; to securely authenticate.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const configuredBackendUrl = import.meta.env.VITE_API_BASE_URL;

export const BACKEND_URL =
    (configuredBackendUrl || "http://localhost:8080").replace(/\/+$/, "");

export const AUTH_TOKEN_KEY = "authToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
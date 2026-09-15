import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = "dsa_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (saved === "light" || saved === "dark") {
                return saved;
            }
        } catch {
            // LocalStorage access error
        }
        return "dark"; // Default is Dark
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // LocalStorage access error
        }
    }, [theme]);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        return {
            theme: "dark",
            toggleTheme: () => {},
            setTheme: () => {}
        };
    }
    return context;
};

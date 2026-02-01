"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * Theme Customization Provider
 * 
 * Maneja la persistencia de temas personalizados en localStorage
 * y aplica las CSS variables a :root cuando se carga la app.
 */

interface ThemeVars {
    '--background': string;
    '--foreground': string;
    '--card': string;
    '--card-foreground': string;
    '--primary': string;
    '--primary-foreground': string;
    '--secondary': string;
    '--secondary-foreground': string;
    '--muted': string;
    '--muted-foreground': string;
    '--accent': string;
    '--accent-foreground': string;
    '--border': string;
    '--input': string;
    '--ring': string;
    [key: string]: string;
}

interface ThemeCustomizationContextType {
    isCustomThemeActive: boolean;
    customTheme: ThemeVars | null;
    applyTheme: (vars: ThemeVars) => void;
    resetTheme: () => void;
}

const ThemeCustomizationContext = createContext<ThemeCustomizationContextType | null>(null);

const STORAGE_KEY = 'seencel_custom_theme';

export function ThemeCustomizationProvider({ children }: { children: React.ReactNode }) {
    const [customTheme, setCustomTheme] = useState<ThemeVars | null>(null);
    const [isCustomThemeActive, setIsCustomThemeActive] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as ThemeVars;
                setCustomTheme(parsed);
                setIsCustomThemeActive(true);

                // Apply to :root
                Object.entries(parsed).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(key, value);
                });
            }
        } catch (error) {
            console.error('Error loading custom theme:', error);
        }
    }, []);

    // Apply theme and save to localStorage
    const applyTheme = useCallback((vars: ThemeVars) => {
        try {
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(vars));

            // Apply to :root
            Object.entries(vars).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value);
            });

            setCustomTheme(vars);
            setIsCustomThemeActive(true);
        } catch (error) {
            console.error('Error applying custom theme:', error);
        }
    }, []);

    // Reset to default theme
    const resetTheme = useCallback(() => {
        try {
            // Remove from localStorage
            localStorage.removeItem(STORAGE_KEY);

            // Remove custom properties from :root
            if (customTheme) {
                Object.keys(customTheme).forEach((key) => {
                    document.documentElement.style.removeProperty(key);
                });
            }

            setCustomTheme(null);
            setIsCustomThemeActive(false);
        } catch (error) {
            console.error('Error resetting theme:', error);
        }
    }, [customTheme]);

    return (
        <ThemeCustomizationContext.Provider
            value={{
                isCustomThemeActive,
                customTheme,
                applyTheme,
                resetTheme
            }}
        >
            {children}
        </ThemeCustomizationContext.Provider>
    );
}

export function useThemeCustomization() {
    const context = useContext(ThemeCustomizationContext);
    if (!context) {
        throw new Error('useThemeCustomization must be used within ThemeCustomizationProvider');
    }
    return context;
}

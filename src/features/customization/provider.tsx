"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { ThemePreset, CustomizationContextValue } from "./types";
import "./styles/themes.css";

/**
 * Customization Provider
 * 
 * Contexto global para el sistema de personalización.
 * Maneja temas y (en el futuro) layouts drag-drop.
 */

const CustomizationContext = createContext<CustomizationContextValue>({
    theme: 'default',
    setTheme: () => { },
});

export function useCustomization() {
    return useContext(CustomizationContext);
}

interface CustomizationProviderProps {
    children: ReactNode;
    defaultTheme?: ThemePreset;
}

export function CustomizationProvider({
    children,
    defaultTheme = 'midnight'
}: CustomizationProviderProps) {
    const [theme, setTheme] = useState<ThemePreset>(defaultTheme);

    // Map theme preset to CSS class
    const themeClass = theme === 'default' ? '' : `theme-${theme}`;

    return (
        <CustomizationContext.Provider value={{ theme, setTheme }}>
            <div className={themeClass}>
                {children}
            </div>
        </CustomizationContext.Provider>
    );
}

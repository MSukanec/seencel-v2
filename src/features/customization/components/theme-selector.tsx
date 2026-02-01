"use client";

import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomization } from "../provider";
import type { ThemePreset } from "../types";

/**
 * Theme Selector Component
 * 
 * Dropdown para seleccionar temas del sistema de customización.
 */

const THEMES: { id: ThemePreset; name: string; color: string }[] = [
    { id: 'default', name: 'Default', color: '#a3e635' },
    { id: 'midnight', name: 'Midnight', color: '#6366f1' },
    { id: 'cyber', name: 'Cyber', color: '#ec4899' },
    { id: 'ocean', name: 'Ocean', color: '#06b6d4' },
    { id: 'sunset', name: 'Sunset', color: '#f97316' },
    { id: 'forest', name: 'Forest', color: '#22c55e' },
];

interface ThemeSelectorProps {
    /** Show as floating button (fixed position) */
    floating?: boolean;
}

export function ThemeSelector({ floating = false }: ThemeSelectorProps) {
    const { theme, setTheme } = useCustomization();

    const button = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Tema</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {THEMES.map((t) => (
                    <DropdownMenuItem
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className="gap-2"
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: t.color }}
                        />
                        {t.name}
                        {theme === t.id && (
                            <span className="ml-auto text-xs text-primary">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    if (floating) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                {button}
            </div>
        );
    }

    return button;
}

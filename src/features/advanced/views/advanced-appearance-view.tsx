"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Loader2, Sparkles, RotateCcw, Check, Palette } from "lucide-react";
import { extractColorsFromImage } from "@/features/customization/lib/color-extraction";
import { generateRefinedPalette } from "@/features/customization/lib/palette-analysis";
import { detectPaletteMood, MOOD_TYPOGRAPHY, type TypographyMood } from "@/features/customization/lib/typography-mood";
import { useThemeCustomization } from "@/stores/theme-store";
import { BentoKpiCard } from "@/components/widgets/grid/presets/bento-kpi-card";
import type { ExtractedColor, CuratedPalette } from "@/features/customization/types/palette";
import { DollarSign, Users, TrendingUp, Folder } from "lucide-react";
import { toast } from "sonner";

/**
 * Advanced Appearance View
 * 
 * Permite a los usuarios personalizar la apariencia de Seencel
 * subiendo una imagen y aplicando la paleta extraída a toda la aplicación.
 */
export function AdvancedAppearanceView() {
    const { isCustomThemeActive, applyTheme, resetTheme } = useThemeCustomization();
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
    const [activePalette, setActivePalette] = useState<CuratedPalette | null>(null);
    const [currentMood, setCurrentMood] = useState<TypographyMood | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    // Chart colors derived from extracted palette
    const chartColors = useMemo(() => {
        if (extractedColors.length >= 4) {
            return {
                primary: extractedColors[0]?.hex || '#8b5cf6',
                secondary: extractedColors[1]?.hex || '#6366f1',
                tertiary: extractedColors[2]?.hex || '#ec4899',
                quaternary: extractedColors[3]?.hex || '#f59e0b',
            };
        }
        return {
            primary: '#8b5cf6',
            secondary: '#6366f1',
            tertiary: '#ec4899',
            quaternary: '#f59e0b',
        };
    }, [extractedColors]);

    // Helper: Convert palette.colors to CSS variables
    const paletteToCssVars = useCallback((palette: CuratedPalette) => {
        return {
            // Base colors
            '--background': palette.colors.background,
            '--foreground': palette.colors.foreground,
            '--card': palette.colors.card,
            '--card-foreground': palette.colors.cardForeground,
            '--primary': palette.colors.primary,
            '--primary-foreground': palette.colors.primaryForeground,
            '--secondary': palette.colors.muted,
            '--secondary-foreground': palette.colors.mutedForeground,
            '--muted': palette.colors.muted,
            '--muted-foreground': palette.colors.mutedForeground,
            '--accent': palette.colors.accent,
            '--accent-foreground': palette.colors.accentForeground,
            '--border': palette.colors.border,
            '--input': palette.colors.border,
            '--ring': palette.colors.primary,
            '--popover': palette.colors.card,
            '--popover-foreground': palette.colors.cardForeground,
            // Sidebar-specific variables
            '--sidebar': palette.colors.background,
            '--sidebar-foreground': palette.colors.foreground,
            '--sidebar-primary': palette.colors.primary,
            '--sidebar-primary-foreground': palette.colors.primaryForeground,
            '--sidebar-accent': palette.colors.accent,
            '--sidebar-accent-foreground': palette.colors.accentForeground,
            '--sidebar-border': palette.colors.border,
            '--sidebar-ring': palette.colors.primary,
        };
    }, []);

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona una imagen válida');
            return;
        }

        setIsLoading(true);
        setError(null);
        setPreviewUrl(URL.createObjectURL(file));

        try {
            const colors = await extractColorsFromImage(file, 8);
            setExtractedColors(colors);

            const palette = generateRefinedPalette(colors, 'Custom Palette');
            setActivePalette(palette);

            const mood = detectPaletteMood(colors);
            setCurrentMood(mood);

            // Apply preview styles to preview container
            if (previewRef.current && palette) {
                const cssVars = paletteToCssVars(palette);
                Object.entries(cssVars).forEach(([key, value]) => {
                    previewRef.current!.style.setProperty(key, value);
                });
            }
        } catch (err) {
            setError('Error extrayendo colores. Intenta con otra imagen.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [paletteToCssVars]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleApplyToSeencel = useCallback(() => {
        if (!activePalette) {
            toast.error('Primero extrae una paleta de una imagen');
            return;
        }

        const cssVars = paletteToCssVars(activePalette);
        applyTheme(cssVars as any);
        toast.success('¡Tema personalizado aplicado!', {
            description: 'Los colores se guardarán en tu navegador.'
        });
    }, [activePalette, applyTheme, paletteToCssVars]);

    const handleReset = useCallback(() => {
        resetTheme();
        setPreviewUrl(null);
        setExtractedColors([]);
        setActivePalette(null);
        setCurrentMood(null);
        toast.success('Tema restaurado a valores por defecto');
    }, [resetTheme]);

    const moodConfig = currentMood ? MOOD_TYPOGRAPHY[currentMood] : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium">Personaliza la Apariencia</h2>
                    <p className="text-sm text-muted-foreground">
                        Subí una foto y transformá los colores de Seencel
                    </p>
                </div>
                {isCustomThemeActive && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Tema personalizado activo</span>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Imagen de Referencia
                        </CardTitle>
                        <CardDescription>
                            Subí una foto de interiores, arquitectura o cualquier imagen con colores que te gusten
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                relative border-2 border-dashed rounded-xl p-6 text-center 
                                transition-all cursor-pointer hover:border-primary/50
                                ${previewUrl ? 'border-primary' : 'border-muted'}
                                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                            />

                            {previewUrl ? (
                                <div className="space-y-4">
                                    {/* Paleta arriba */}
                                    {!isLoading && extractedColors.length > 0 && (
                                        <div className="flex justify-center gap-2">
                                            {extractedColors.slice(0, 6).map((color, i) => (
                                                <div
                                                    key={i}
                                                    className="w-10 h-10 rounded-lg shadow-sm transition-transform hover:scale-110 ring-1 ring-white/10"
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.hex}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Imagen grande */}
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />

                                    {isLoading && (
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Extrayendo colores...</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-4">
                                    <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="font-medium mb-1">Arrastrá una imagen aquí</p>
                                    <p className="text-sm text-muted-foreground">
                                        o hacé clic para seleccionar
                                    </p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="mt-3 text-sm text-destructive">{error}</p>
                        )}

                        {/* Action buttons */}
                        <div className="mt-4 flex gap-3">
                            <Button
                                onClick={handleApplyToSeencel}
                                disabled={!activePalette || isLoading}
                                className="flex-1 gap-2"
                            >
                                <Sparkles className="h-4 w-4" />
                                Aplicar a Seencel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                disabled={!isCustomThemeActive && !activePalette}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Vista Previa</CardTitle>
                        <CardDescription>
                            Así se verán los componentes con tu paleta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            ref={previewRef}
                            className="rounded-xl p-4 transition-all duration-300"
                            style={{
                                backgroundColor: activePalette?.colors?.background || 'var(--background)',
                                color: activePalette?.colors?.foreground || 'var(--foreground)',
                            }}
                        >
                            {/* Mini Dashboard Preview */}
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className="p-3 rounded-lg"
                                    style={{
                                        backgroundColor: activePalette?.colors?.card || 'var(--card)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="p-1.5 rounded"
                                            style={{ backgroundColor: chartColors.primary + '20' }}
                                        >
                                            <DollarSign className="h-3 w-3" style={{ color: chartColors.primary }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground">Ingresos</span>
                                    </div>
                                    <p className="text-lg font-semibold">$94,127</p>
                                    <p className="text-xs" style={{ color: chartColors.primary }}>+23.5%</p>
                                </div>

                                <div
                                    className="p-3 rounded-lg"
                                    style={{
                                        backgroundColor: activePalette?.colors?.card || 'var(--card)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="p-1.5 rounded"
                                            style={{ backgroundColor: chartColors.secondary + '20' }}
                                        >
                                            <Users className="h-3 w-3" style={{ color: chartColors.secondary }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground">Equipo</span>
                                    </div>
                                    <p className="text-lg font-semibold">24</p>
                                    <p className="text-xs" style={{ color: chartColors.secondary }}>+3 nuevos</p>
                                </div>

                                <div
                                    className="p-3 rounded-lg"
                                    style={{
                                        backgroundColor: activePalette?.colors?.card || 'var(--card)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="p-1.5 rounded"
                                            style={{ backgroundColor: chartColors.tertiary + '20' }}
                                        >
                                            <TrendingUp className="h-3 w-3" style={{ color: chartColors.tertiary }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground">Progreso</span>
                                    </div>
                                    <p className="text-lg font-semibold">78%</p>
                                    <p className="text-xs" style={{ color: chartColors.tertiary }}>En tiempo</p>
                                </div>

                                <div
                                    className="p-3 rounded-lg"
                                    style={{
                                        backgroundColor: activePalette?.colors?.card || 'var(--card)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="p-1.5 rounded"
                                            style={{ backgroundColor: chartColors.quaternary + '20' }}
                                        >
                                            <Folder className="h-3 w-3" style={{ color: chartColors.quaternary }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground">Proyectos</span>
                                    </div>
                                    <p className="text-lg font-semibold">12</p>
                                    <p className="text-xs" style={{ color: chartColors.quaternary }}>4 activos</p>
                                </div>
                            </div>

                            {/* Accent Bar */}
                            <div
                                className="mt-3 h-1.5 rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${chartColors.primary}, ${chartColors.secondary}, ${chartColors.tertiary}, ${chartColors.quaternary})`
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
                Los cambios se guardan localmente en tu navegador y se aplicarán cada vez que uses Seencel.
            </p>
        </div>
    );
}

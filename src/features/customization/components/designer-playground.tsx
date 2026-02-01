"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image, Loader2, Sparkles, RotateCcw, TrendingUp, Users, Folder, Clock, Type, Waves, DollarSign, Activity, BarChart3, Briefcase, Sun, Moon, Scan } from "lucide-react";
import { extractColorsFromImage } from "../lib/color-extraction";
import { isPaletteLightMode, generateRefinedPalette, applyRefinedPalette, removeRefinedMode } from "../lib/palette-analysis";
import { detectPaletteMood, applyMoodTypography, MOOD_TYPOGRAPHY, type TypographyMood } from "../lib/typography-mood";
import { AmbientAnimations } from "./ambient-animations";
import { PhotoZoneSelector } from "./photo-zone-selector";
import { DraggableBentoGrid, type DraggableItem } from "./draggable-bento-grid";
import { BentoKpiCard } from "@/components/bento/bento-kpi-card";
import { BentoListCard, type BentoListItem } from "@/components/bento/bento-list-card";
import type { CuratedPalette, ExtractedColor } from "../types/palette";
import "../styles/refined-mode.css";
import "../styles/typography-moods.css";

/**
 * Refined Designer Playground
 * 
 * Un playground de diseño que transforma la UI basándose en fotos de interiores.
 * Diseñado para que los diseñadores experimenten con paletas elegantes.
 * 
 * Features:
 * - Extracción de paleta desde imagen
 * - Tipografía dinámica según mood
 * - Animaciones ambientales
 */

export function DesignerPlayground() {
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
    const [activePalette, setActivePalette] = useState<CuratedPalette | null>(null);
    const [currentMood, setCurrentMood] = useState<TypographyMood | null>(null);
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [showZoneSelector, setShowZoneSelector] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const playgroundRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync dark mode class with state
    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => {
            const newValue = !prev;
            if (playgroundRef.current) {
                if (newValue) {
                    playgroundRef.current.classList.add('dark-preview');
                } else {
                    playgroundRef.current.classList.remove('dark-preview');
                }
            }
            return newValue;
        });
    }, []);

    // Chart colors derived from extracted palette or defaults
    const chartColors = useMemo(() => {
        if (extractedColors.length >= 4) {
            // Use colors from extracted palette
            return {
                primary: extractedColors[0]?.hex || '#8b5cf6',
                secondary: extractedColors[1]?.hex || '#6366f1',
                tertiary: extractedColors[2]?.hex || '#ec4899',
                quaternary: extractedColors[3]?.hex || '#f59e0b',
                accent: extractedColors[4]?.hex || '#10b981',
            };
        }
        // Default palette-compatible colors
        return {
            primary: '#8b5cf6',
            secondary: '#6366f1',
            tertiary: '#ec4899',
            quaternary: '#f59e0b',
            accent: '#10b981',
        };
    }, [extractedColors]);

    // Bento items with charts - colors update based on extracted palette
    const bentoItems: DraggableItem[] = useMemo(() => [
        {
            id: 'revenue',
            size: 'sm',
            content: (
                <BentoKpiCard
                    title="Ingresos"
                    amount={94127}
                    trend={{ value: "+23.5%", direction: "up" }}
                    icon={<DollarSign className="h-4 w-4" />}
                    chartType="area"
                    chartData={[30, 45, 38, 52, 48, 65, 72, 68, 85, 94]}
                    chartColor={chartColors.primary}
                    chartPosition="bottom"
                />
            )
        },
        {
            id: 'projects',
            size: 'sm',
            content: (
                <BentoKpiCard
                    title="Proyectos"
                    value="24"
                    trend={{ value: "+12%", direction: "up" }}
                    icon={<Briefcase className="h-4 w-4" />}
                    chartType="bar"
                    chartData={[4, 6, 3, 8, 5, 7, 6, 9, 8, 10]}
                    chartColor={chartColors.secondary}
                    chartPosition="bottom"
                />
            )
        },
        {
            id: 'clients',
            size: 'sm',
            content: (
                <BentoKpiCard
                    title="Clientes"
                    value="156"
                    trend={{ value: "+8%", direction: "up" }}
                    icon={<Users className="h-4 w-4" />}
                    chartType="area"
                    chartData={[120, 125, 132, 128, 140, 145, 142, 150, 152, 156]}
                    chartColor={chartColors.tertiary}
                    chartPosition="bottom"
                />
            )
        },
        {
            id: 'activity',
            size: 'sm',
            content: (
                <BentoKpiCard
                    title="Actividad"
                    value="312h"
                    trend={{ value: "+5%", direction: "up" }}
                    icon={<Activity className="h-4 w-4" />}
                    chartType="area"
                    chartData={[280, 295, 288, 302, 298, 310, 305, 308, 315, 312]}
                    chartColor={chartColors.quaternary}
                    chartPosition="bottom"
                />
            )
        },
        {
            id: 'top-projects',
            size: 'md',
            content: (
                <BentoListCard
                    title="Proyectos Recientes"
                    icon={<Folder className="h-4 w-4" />}
                    items={[
                        { id: '1', title: 'Residencia Palermo', subtitle: 'En progreso', badge: '65%', status: 'active' },
                        { id: '2', title: 'Oficinas Madero', subtitle: 'Revisión', badge: '90%', status: 'warning' },
                        { id: '3', title: 'Loft Belgrano', subtitle: 'Completado', badge: '100%', status: 'active' },
                    ]}
                    maxItems={3}
                    size="md"
                />
            )
        },
        {
            id: 'growth',
            size: 'md',
            content: (
                <BentoKpiCard
                    title="Crecimiento Anual"
                    amount={284500}
                    trend={{ value: "+42%", direction: "up", label: "vs año anterior" }}
                    icon={<BarChart3 className="h-4 w-4" />}
                    chartType="bar"
                    chartData={[45, 52, 48, 61, 55, 67, 72, 78, 85, 92, 88, 95]}
                    chartColor={chartColors.accent}
                    chartPosition="right"
                    size="md"
                />
            )
        }
    ], [chartColors]);

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona una imagen');
            return;
        }

        setIsLoading(true);
        setError(null);
        setPreviewUrl(URL.createObjectURL(file));

        try {
            const colors = await extractColorsFromImage(file, 8);
            setExtractedColors(colors);

            // Generate refined palette optimized for elegance
            const palette = generateRefinedPalette(colors, 'Designer Palette');
            setActivePalette(palette);

            // Detect mood and apply typography
            const mood = detectPaletteMood(colors);
            setCurrentMood(mood);

            // Apply to playground
            if (playgroundRef.current) {
                applyRefinedPalette(playgroundRef.current, palette);
                applyMoodTypography(playgroundRef.current, mood);
            }
        } catch (err) {
            setError('Error extrayendo colores. Intenta con otra imagen.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle zone selection - extract colors from selected area only
    const handleZoneSelected = useCallback(async (zoneCanvas: HTMLCanvasElement) => {
        setShowZoneSelector(false);
        setIsLoading(true);
        setError(null);

        try {
            // Convert canvas to blob then to file
            const blob = await new Promise<Blob>((resolve, reject) => {
                zoneCanvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/png');
            });
            const zoneFile = new File([blob], 'zone.png', { type: 'image/png' });

            // Extract colors from zone
            const colors = await extractColorsFromImage(zoneFile, 8);
            setExtractedColors(colors);

            // Generate refined palette
            const palette = generateRefinedPalette(colors, 'Zone Palette');
            setActivePalette(palette);

            // Detect mood
            const mood = detectPaletteMood(colors);
            setCurrentMood(mood);

            // Apply
            if (playgroundRef.current) {
                applyRefinedPalette(playgroundRef.current, palette);
                applyMoodTypography(playgroundRef.current, mood);
            }
        } catch (err) {
            setError('Error procesando zona. Intenta de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleReset = () => {
        setActivePalette(null);
        setPreviewUrl(null);
        setExtractedColors([]);
        setCurrentMood(null);
        setDarkMode(false);
        if (playgroundRef.current) {
            removeRefinedMode(playgroundRef.current);
            playgroundRef.current.classList.remove('mood-classic', 'mood-modern', 'mood-luxe', 'mood-natural', 'mood-industrial', 'dark-preview');
        }
    };

    return (
        <div
            ref={playgroundRef}
            className="min-h-screen transition-all duration-500 relative overflow-hidden"
            style={{
                background: activePalette ? 'var(--background)' : undefined,
                color: activePalette ? 'var(--foreground)' : undefined
            }}
        >
            {/* Ambient Animations Layer - siempre activas con colores default o extraídos */}
            <AmbientAnimations
                colors={extractedColors.length > 0 ? extractedColors : undefined}
                type="orbs"
                intensity={extractedColors.length > 0 ? 0.7 : 0.4}
                enabled={animationsEnabled}
            />

            {/* Header */}
            <header className="border-b border-[var(--border,#e5e5e5)] bg-[var(--card,white)] relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-medium heading">Designer Playground</h1>
                        <p className="text-sm text-[var(--muted-foreground,#666)]">
                            Sube una foto de interiores para transformar la UI
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Mood indicator */}
                        {currentMood && (
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: 'var(--accent, #f5f5f5)',
                                    color: 'var(--primary, #666)'
                                }}
                            >
                                <Type className="h-3.5 w-3.5" />
                                <span className="capitalize">{currentMood}</span>
                            </div>
                        )}
                        {/* Animation toggle */}
                        {extractedColors.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                                className={`gap-1.5 ${animationsEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                <Waves className="h-4 w-4" />
                            </Button>
                        )}
                        {/* Dark/Light Mode toggle */}
                        {activePalette && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleDarkMode}
                                className="gap-1.5"
                                title={darkMode ? "Cambiar a Light Mode" : "Cambiar a Dark Mode"}
                            >
                                {darkMode ? (
                                    <Sun className="h-4 w-4 text-amber-500" />
                                ) : (
                                    <Moon className="h-4 w-4 text-indigo-500" />
                                )}
                            </Button>
                        )}
                        {activePalette && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                className="gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Image Upload Zone */}
                <div className="mb-8">
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative border-2 border-dashed rounded-2xl p-8 text-center 
                            transition-all cursor-pointer
                            ${previewUrl ? 'border-[var(--primary,#666)]' : 'border-[var(--border,#ddd)]'}
                            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                            hover:border-[var(--primary,#666)]
                        `}
                        style={{ backgroundColor: 'var(--card, white)' }}
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
                            <div className="flex items-center gap-6">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-32 h-24 object-cover rounded-xl shadow-lg"
                                />
                                <div className="flex-1 text-left">
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Extrayendo paleta...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="font-medium mb-2">Colores extraídos</p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex gap-2">
                                                    {extractedColors.slice(0, 6).map((color, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-10 h-10 rounded-lg shadow-md transition-transform hover:scale-110"
                                                            style={{ backgroundColor: color.hex }}
                                                            title={color.hex}
                                                        />
                                                    ))}
                                                </div>
                                                {/* Zone selector button */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowZoneSelector(true);
                                                    }}
                                                    className="gap-2 ml-2"
                                                    title="Seleccionar zona específica de la imagen"
                                                >
                                                    <Scan className="h-4 w-4" />
                                                    Zona
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8">
                                <div
                                    className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                    style={{ backgroundColor: 'var(--accent, #f5f5f5)' }}
                                >
                                    <Image className="h-8 w-8" style={{ color: 'var(--primary, #666)' }} />
                                </div>
                                <p className="text-lg font-medium mb-1">
                                    Arrastra una foto de interiores aquí
                                </p>
                                <p className="text-sm" style={{ color: 'var(--muted-foreground, #999)' }}>
                                    La UI se transformará basándose en la paleta de colores
                                </p>
                            </div>
                        )}
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
                    )}
                </div>

                {/* Draggable Bento Dashboard */}
                <DraggableBentoGrid
                    items={bentoItems}
                    columns={4}
                    gap="md"
                    className="mb-8"
                />

                {/* Feature Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div
                        className="refined-card lg:col-span-2 p-6 rounded-2xl"
                        style={{
                            backgroundColor: 'var(--card, white)',
                            boxShadow: 'var(--shadow-soft, 0 2px 8px rgba(0,0,0,0.08))'
                        }}
                    >
                        <h3 className="font-medium mb-4">Proyectos Recientes</h3>
                        <div className="space-y-3">
                            {['Residencia Palermo', 'Oficinas Madero', 'Loft Belgrano'].map((name, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.01]"
                                    style={{ backgroundColor: 'var(--accent, #f5f5f5)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg"
                                            style={{
                                                backgroundColor: activePalette?.sourceColors?.[i]?.hex || `hsl(${i * 60}, 20%, 80%)`
                                            }}
                                        />
                                        <div>
                                            <p className="font-medium">{name}</p>
                                            <p className="text-sm" style={{ color: 'var(--muted-foreground, #999)' }}>
                                                {['En progreso', 'Revisión', 'Completado'][i]}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className="text-sm px-3 py-1 rounded-full"
                                        style={{
                                            backgroundColor: 'var(--background, white)',
                                            color: 'var(--muted-foreground, #666)'
                                        }}
                                    >
                                        {['65%', '90%', '100%'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className="refined-card p-6 rounded-2xl"
                        style={{
                            backgroundColor: 'var(--card, white)',
                            boxShadow: 'var(--shadow-soft, 0 2px 8px rgba(0,0,0,0.08))'
                        }}
                    >
                        <h3 className="font-medium mb-4">Paleta Activa</h3>
                        {activePalette ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Background', color: activePalette.colors.background },
                                        { label: 'Card', color: activePalette.colors.card },
                                        { label: 'Primary', color: activePalette.colors.primary },
                                        { label: 'Accent', color: activePalette.colors.accent },
                                        { label: 'Text', color: activePalette.colors.foreground },
                                        { label: 'Muted', color: activePalette.colors.muted },
                                    ].map((item, i) => (
                                        <div key={i} className="text-center">
                                            <div
                                                className="h-12 rounded-lg mb-1 border"
                                                style={{
                                                    background: item.color,
                                                    borderColor: 'var(--border, #eee)'
                                                }}
                                            />
                                            <span className="text-xs" style={{ color: 'var(--muted-foreground, #999)' }}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div
                                className="h-48 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: 'var(--accent, #f5f5f5)' }}
                            >
                                <div className="text-center">
                                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm" style={{ color: 'var(--muted-foreground, #999)' }}>
                                        Sube una imagen para ver la paleta
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Photo Zone Selector Modal */}
            {showZoneSelector && previewUrl && (
                <PhotoZoneSelector
                    imageUrl={previewUrl}
                    onZoneSelected={handleZoneSelected}
                    onCancel={() => setShowZoneSelector(false)}
                />
            )}
        </div>
    );
}

// Demo Card Component
function DemoCard({
    title,
    value,
    change,
    icon
}: {
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
}) {
    return (
        <div
            className="refined-card p-5 rounded-2xl transition-all hover:scale-[1.02]"
            style={{
                backgroundColor: 'var(--card, white)',
                boxShadow: 'var(--shadow-soft, 0 2px 8px rgba(0,0,0,0.08))'
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <span
                    className="text-sm"
                    style={{ color: 'var(--muted-foreground, #999)' }}
                >
                    {title}
                </span>
                <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--accent, #f5f5f5)' }}
                >
                    <span style={{ color: 'var(--primary, #666)' }}>{icon}</span>
                </div>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold">{value}</span>
                <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--primary, #666)' }}
                >
                    {change}
                </span>
            </div>
        </div>
    );
}

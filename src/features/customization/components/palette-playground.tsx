"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Image, Sparkles, RotateCcw } from "lucide-react";
import { PaletteExtractor } from "./palette-extractor";
import { PalettePresetGrid } from "./palette-preset-grid";
import { applyPaletteToElement, resetPalette } from "../lib/palette-mapping";
import type { CuratedPalette } from "../types/palette";

/**
 * PalettePlayground
 * 
 * Panel completo para experimentar con paletas de colores.
 * Combina presets curados + extracción desde imagen.
 */

interface PalettePlaygroundProps {
    /** Target element to apply palette (defaults to document) */
    targetRef?: React.RefObject<HTMLElement | null>;
}

export function PalettePlayground({ targetRef }: PalettePlaygroundProps) {
    const [activePalette, setActivePalette] = useState<CuratedPalette | null>(null);
    const [activeTab, setActiveTab] = useState<'presets' | 'image'>('presets');

    const handlePaletteSelect = (palette: CuratedPalette) => {
        setActivePalette(palette);
        if (targetRef?.current) {
            applyPaletteToElement(targetRef.current, palette);
        } else {
            // Apply to the closest .theme-* wrapper or document
            const wrapper = document.querySelector('[class*="theme-"]') as HTMLElement;
            if (wrapper) {
                applyPaletteToElement(wrapper, palette);
            }
        }
    };

    const handleReset = () => {
        setActivePalette(null);
        if (targetRef?.current) {
            resetPalette(targetRef.current);
        } else {
            const wrapper = document.querySelector('[class*="theme-"]') as HTMLElement;
            if (wrapper) {
                resetPalette(wrapper);
            }
        }
    };

    return (
        <Card className="w-80 max-h-[600px] overflow-hidden flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-medium">
                        Color Palette
                    </CardTitle>
                </div>
                {activePalette && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="h-7 px-2 text-xs"
                    >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                    </Button>
                )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 pt-0">
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'presets' | 'image')}
                >
                    <TabsList className="w-full mb-4">
                        <TabsTrigger value="presets" className="flex-1 gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            Curadas
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex-1 gap-1.5">
                            <Image className="h-3.5 w-3.5" />
                            Desde Imagen
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="presets" className="mt-0">
                        <PalettePresetGrid
                            selectedId={activePalette?.id}
                            onSelect={handlePaletteSelect}
                        />
                    </TabsContent>

                    <TabsContent value="image" className="mt-0">
                        <PaletteExtractor
                            onPaletteGenerated={handlePaletteSelect}
                        />

                        {/* Tips */}
                        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium">💡 Tip:</span> Usa fotos de
                                interiores, materiales o mood boards para mejores resultados.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Active palette preview */}
                {activePalette && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">
                                {activePalette.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase">
                                {activePalette.source}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            <div className="space-y-1">
                                <div
                                    className="h-6 rounded"
                                    style={{ background: activePalette.colors.background }}
                                    title="Background"
                                />
                                <p className="text-[9px] text-center text-muted-foreground">BG</p>
                            </div>
                            <div className="space-y-1">
                                <div
                                    className="h-6 rounded"
                                    style={{ background: activePalette.colors.primary }}
                                    title="Primary"
                                />
                                <p className="text-[9px] text-center text-muted-foreground">Primary</p>
                            </div>
                            <div className="space-y-1">
                                <div
                                    className="h-6 rounded"
                                    style={{ background: activePalette.colors.accent }}
                                    title="Accent"
                                />
                                <p className="text-[9px] text-center text-muted-foreground">Accent</p>
                            </div>
                            <div className="space-y-1">
                                <div
                                    className="h-6 rounded border"
                                    style={{
                                        background: activePalette.colors.foreground,
                                        borderColor: activePalette.colors.border
                                    }}
                                    title="Foreground"
                                />
                                <p className="text-[9px] text-center text-muted-foreground">FG</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

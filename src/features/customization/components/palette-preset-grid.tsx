"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { CURATED_PRESETS } from "../lib/curated-presets";
import type { CuratedPalette } from "../types/palette";

/**
 * PalettePresetGrid
 * 
 * Grid de paletas pre-diseñadas para selección rápida.
 */

interface PalettePresetGridProps {
    selectedId?: string;
    onSelect: (palette: CuratedPalette) => void;
}

export function PalettePresetGrid({ selectedId, onSelect }: PalettePresetGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CURATED_PRESETS.map((preset) => {
                const isSelected = selectedId === preset.id;
                const { colors } = preset.palette;

                return (
                    <Card
                        key={preset.id}
                        onClick={() => onSelect(preset.palette)}
                        className={`
                            cursor-pointer transition-all overflow-hidden
                            hover:scale-105 hover:shadow-lg
                            ${isSelected ? 'ring-2 ring-primary' : ''}
                        `}
                    >
                        <CardContent className="p-3">
                            {/* Color preview bars */}
                            <div className="flex h-12 rounded-lg overflow-hidden mb-2">
                                <div
                                    className="flex-1"
                                    style={{ background: colors.background }}
                                />
                                <div
                                    className="flex-1"
                                    style={{ background: colors.primary }}
                                />
                                <div
                                    className="flex-1"
                                    style={{ background: colors.accent }}
                                />
                                <div
                                    className="flex-1"
                                    style={{ background: colors.foreground }}
                                />
                            </div>

                            {/* Name and selection indicator */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium truncate">
                                        {preset.name}
                                    </p>
                                    {preset.description && (
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            {preset.description}
                                        </p>
                                    )}
                                </div>
                                {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

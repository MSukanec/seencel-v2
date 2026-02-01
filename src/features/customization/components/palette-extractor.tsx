"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image, Loader2, Sparkles } from "lucide-react";
import { extractColorsFromImage } from "../lib/color-extraction";
import { generateCuratedPalette } from "../lib/palette-mapping";
import type { ExtractedColor, CuratedPalette } from "../types/palette";

/**
 * PaletteExtractor Component
 * 
 * Permite subir una imagen y extraer una paleta de colores curada.
 * El corazón del sistema de personalización para diseñadores.
 */

interface PaletteExtractorProps {
    onPaletteGenerated: (palette: CuratedPalette) => void;
}

export function PaletteExtractor({ onPaletteGenerated }: PaletteExtractorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona una imagen');
            return;
        }

        setIsLoading(true);
        setError(null);
        setPreviewUrl(URL.createObjectURL(file));

        try {
            const colors = await extractColorsFromImage(file, 6);
            setExtractedColors(colors);

            const palette = generateCuratedPalette(colors, 'Extracted Palette');
            onPaletteGenerated(palette);
        } catch (err) {
            setError('Error extrayendo colores. Intenta con otra imagen.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [onPaletteGenerated]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                {/* Drop zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-xl p-6 text-center 
                        transition-all cursor-pointer
                        ${previewUrl ? 'border-primary/50' : 'border-border hover:border-primary/30'}
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
                        <div className="relative">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg"
                            />
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <Image className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium">
                                Arrastra una imagen aquí
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                o haz click para seleccionar
                            </p>
                        </div>
                    )}
                </div>

                {/* Extracted colors preview */}
                {extractedColors.length > 0 && !isLoading && (
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium">Colores extraídos</span>
                        </div>
                        <div className="flex gap-1">
                            {extractedColors.slice(0, 6).map((color, i) => (
                                <div
                                    key={i}
                                    className="flex-1 h-8 rounded-md transition-transform hover:scale-110"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.hex}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-destructive mt-3 text-center">
                        {error}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

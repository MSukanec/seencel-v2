"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Scan, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Photo Zone Selector
 * 
 * Permite al usuario seleccionar un área rectangular de una imagen
 * para extraer colores solo de esa zona específica.
 */

interface PhotoZoneSelectorProps {
    imageUrl: string;
    onZoneSelected: (canvas: HTMLCanvasElement) => void;
    onCancel: () => void;
}

interface SelectionRect {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export function PhotoZoneSelector({
    imageUrl,
    onZoneSelected,
    onCancel
}: PhotoZoneSelectorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [selection, setSelection] = useState<SelectionRect | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    // Load image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImage(img);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Draw image and selection overlay
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !image) return;

        // Set canvas size to match container
        const container = containerRef.current;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const scale = containerWidth / image.width;
        canvas.width = containerWidth;
        canvas.height = image.height * scale;

        // Draw image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw selection overlay
        if (selection) {
            const { startX, startY, endX, endY } = selection;
            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            const w = Math.abs(endX - startX);
            const h = Math.abs(endY - startY);

            // Darken non-selected areas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, y); // Top
            ctx.fillRect(0, y + h, canvas.width, canvas.height - y - h); // Bottom
            ctx.fillRect(0, y, x, h); // Left
            ctx.fillRect(x + w, y, canvas.width - x - w, h); // Right

            // Draw selection border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, w, h);

            // Draw corner handles
            const handleSize = 8;
            ctx.fillStyle = 'white';
            ctx.setLineDash([]);
            ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
        }
    }, [image, selection]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelection({ startX: x, startY: y, endX: x, endY: y });
        setIsSelecting(true);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isSelecting) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, canvas.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, canvas.height));

        setSelection(prev => prev ? { ...prev, endX: x, endY: y } : null);
    }, [isSelecting]);

    const handleMouseUp = useCallback(() => {
        setIsSelecting(false);
    }, []);

    const handleConfirm = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !selection || !image) return;

        // Get selection coordinates relative to canvas
        const { startX, startY, endX, endY } = selection;
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const w = Math.abs(endX - startX);
        const h = Math.abs(endY - startY);

        // Minimum selection size
        if (w < 20 || h < 20) {
            alert('Selección muy pequeña. Por favor selecciona un área más grande.');
            return;
        }

        // Create a new canvas with just the selected area
        const zoneCanvas = document.createElement('canvas');
        const ctx = zoneCanvas.getContext('2d');
        if (!ctx) return;

        // Scale back to original image dimensions
        const scale = canvas.width / image.width;
        zoneCanvas.width = w / scale;
        zoneCanvas.height = h / scale;

        ctx.drawImage(
            image,
            x / scale, y / scale, w / scale, h / scale,
            0, 0, zoneCanvas.width, zoneCanvas.height
        );

        onZoneSelected(zoneCanvas);
    }, [selection, image, onZoneSelected]);

    const hasValidSelection = selection &&
        Math.abs(selection.endX - selection.startX) > 20 &&
        Math.abs(selection.endY - selection.startY) > 20;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Scan className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Seleccionar Zona</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Arrastra para seleccionar el área de la imagen
                    </p>
                </div>

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className="relative overflow-auto"
                    style={{ maxHeight: 'calc(90vh - 140px)' }}
                >
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className={cn(
                            "cursor-crosshair w-full",
                            isSelecting && "cursor-grabbing"
                        )}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                        {hasValidSelection
                            ? "Área seleccionada. Haz clic en Confirmar para extraer colores."
                            : "Dibuja un rectángulo sobre la zona que quieras analizar."
                        }
                    </p>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onCancel}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!hasValidSelection}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Confirmar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

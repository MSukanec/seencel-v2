"use client";

import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { cn } from "@/lib/utils";
import { Eraser, PenTool, Type, Upload, X } from "lucide-react";

export interface SignatureData {
    imageBase64: string;
    signerName: string;
    method: "draw" | "type" | "upload";
    timestamp: string;
}

export interface SignaturePadRef {
    getSignatureData: () => SignatureData | null;
    isValid: () => boolean;
    clear: () => void;
}

type SignatureMode = "draw" | "type" | "upload";

interface SignaturePadProps {
    height?: number;
    showNameField?: boolean;
    disclaimer?: string;
    className?: string;
    onValidityChange?: (isValid: boolean) => void;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
    function SignaturePad(
        {
            height = 150,
            showNameField = true,
            disclaimer = "Al firmar, confirmo que acepto los términos y condiciones.",
            className,
            onValidityChange,
        },
        ref
    ) {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [isDrawing, setIsDrawing] = useState(false);
        const [hasDrawn, setHasDrawn] = useState(false);
        const [mode, setMode] = useState<SignatureMode>("draw");
        const [signerName, setSignerName] = useState("");
        const [uploadedImage, setUploadedImage] = useState<string | null>(null);

        // Calculate validity based on mode
        const isValid = (() => {
            const hasName = signerName.trim().length > 0;
            if (showNameField && !hasName) return false;

            switch (mode) {
                case "draw":
                    return hasDrawn;
                case "type":
                    return hasName;
                case "upload":
                    return !!uploadedImage;
                default:
                    return false;
            }
        })();

        // Notify parent of validity changes
        useEffect(() => {
            onValidityChange?.(isValid);
        }, [isValid, onValidityChange]);

        // Initialize canvas
        const initCanvas = useCallback(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const width = container.offsetWidth;
            if (width === 0) return;

            // Simple 1:1 canvas size - no DPI scaling to avoid offset issues
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
        }, [height]);

        // Use ResizeObserver for reliable canvas sizing
        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            const timer = setTimeout(initCanvas, 100);

            const resizeObserver = new ResizeObserver(() => {
                initCanvas();
            });
            resizeObserver.observe(container);

            return () => {
                clearTimeout(timer);
                resizeObserver.disconnect();
            };
        }, [initCanvas]);

        // Get position from mouse or touch event
        const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            if ("touches" in e) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY,
                };
            }

            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        }, []);

        // Drawing handlers
        const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
            if (mode !== "draw") return;

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx) return;

            const pos = getPosition(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            setIsDrawing(true);
        }, [mode, getPosition]);

        const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
            if (!isDrawing || mode !== "draw") return;

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx) return;

            const pos = getPosition(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            setHasDrawn(true);
        }, [isDrawing, mode, getPosition]);

        const stopDrawing = useCallback(() => {
            setIsDrawing(false);
        }, []);

        // Clear canvas
        const clearCanvas = useCallback(() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx || !canvas) return;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setHasDrawn(false);
        }, []);

        // Render typed signature on canvas (uses signerName)
        useEffect(() => {
            if (mode !== "type") return;

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx || !canvas) return;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (signerName.trim()) {
                ctx.fillStyle = "#000000";
                ctx.font = "italic 48px 'Brush Script MT', cursive, serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(signerName, canvas.width / 2, canvas.height / 2);
            }
        }, [mode, signerName]);

        // Handle file upload
        const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setUploadedImage(base64);

                const canvas = canvasRef.current;
                const ctx = canvas?.getContext("2d");
                if (!ctx || !canvas) return;

                const img = new Image();
                img.onload = () => {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;
                    const x = (canvas.width - scaledWidth) / 2;
                    const y = (canvas.height - scaledHeight) / 2;

                    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                };
                img.src = base64;
            };
            reader.readAsDataURL(file);
        }, []);

        const clearUpload = useCallback(() => {
            setUploadedImage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            clearCanvas();
        }, [clearCanvas]);

        // Get signature data
        const getSignatureData = useCallback((): SignatureData | null => {
            const canvas = canvasRef.current;
            if (!canvas) return null;

            const name = signerName.trim();
            if (showNameField && !name) return null;
            if (mode === "draw" && !hasDrawn) return null;
            if (mode === "type" && !name) return null;
            if (mode === "upload" && !uploadedImage) return null;

            return {
                imageBase64: canvas.toDataURL("image/png"),
                signerName: name,
                method: mode,
                timestamp: new Date().toISOString(),
            };
        }, [signerName, mode, hasDrawn, uploadedImage, showNameField]);

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            getSignatureData,
            isValid: () => isValid,
            clear: () => {
                clearCanvas();
                setSignerName("");
                setUploadedImage(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            },
        }), [getSignatureData, isValid, clearCanvas]);

        const handleModeChange = (newMode: SignatureMode) => {
            setMode(newMode);
            clearCanvas();
            setUploadedImage(null);
        };

        return (
            <div className={cn("space-y-4", className)}>
                {/* Name Field */}
                {showNameField && (
                    <FormGroup label="Nombre completo" htmlFor="signer-name" required>
                        <Input
                            id="signer-name"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="Ingresa tu nombre completo"
                        />
                    </FormGroup>
                )}

                {/* Mode Toggle - 3 tabs */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                    <Button
                        type="button"
                        variant={mode === "draw" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleModeChange("draw")}
                    >
                        <PenTool className="h-4 w-4 mr-2" />
                        Dibujar
                    </Button>
                    <Button
                        type="button"
                        variant={mode === "type" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleModeChange("type")}
                    >
                        <Type className="h-4 w-4 mr-2" />
                        Texto
                    </Button>
                    <Button
                        type="button"
                        variant={mode === "upload" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleModeChange("upload")}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir
                    </Button>
                </div>

                {/* Signature Area */}
                <FormGroup label="Firma" required>
                    <div ref={containerRef}>
                        {mode === "draw" && (
                            <div className="relative">
                                <canvas
                                    ref={canvasRef}
                                    className="border border-input rounded-lg cursor-crosshair touch-none bg-white w-full"
                                    style={{ height }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                {!hasDrawn && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground">
                                        Firma aquí
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/90 hover:bg-background shadow-sm"
                                    onClick={clearCanvas}
                                >
                                    <Eraser className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {mode === "type" && (
                            <>
                                <div
                                    className="border border-input rounded-lg bg-white flex items-center justify-center w-full"
                                    style={{ height }}
                                >
                                    <span
                                        className="text-4xl text-black"
                                        style={{ fontFamily: "'Brush Script MT', cursive, serif", fontStyle: "italic" }}
                                    >
                                        {signerName.trim() || "Escribe tu nombre arriba"}
                                    </span>
                                </div>
                                <canvas ref={canvasRef} style={{ display: "none" }} />
                            </>
                        )}

                        {mode === "upload" && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="signature-upload"
                                />

                                {!uploadedImage ? (
                                    <label
                                        htmlFor="signature-upload"
                                        className="border border-dashed border-input rounded-lg bg-white flex flex-col items-center justify-center w-full cursor-pointer hover:bg-muted/50 transition-colors"
                                        style={{ height }}
                                    >
                                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">
                                            Haz clic para subir tu firma
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            PNG o JPG
                                        </span>
                                    </label>
                                ) : (
                                    <div className="relative">
                                        <canvas
                                            ref={canvasRef}
                                            className="border border-input rounded-lg bg-white w-full"
                                            style={{ height }}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={clearUpload}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </FormGroup>

                {/* Disclaimer */}
                {disclaimer && (
                    <p className="text-xs text-muted-foreground">
                        {disclaimer}
                    </p>
                )}
            </div>
        );
    }
);


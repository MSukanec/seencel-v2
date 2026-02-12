"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfThumbnailProps {
    url: string;
    className?: string;
}

export function PdfThumbnail({ url, className }: PdfThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function renderPdf() {
            try {
                const pdfjsLib = await import("pdfjs-dist");

                // Build absolute URL at runtime to prevent Turbopack
                // from intercepting the dynamic import of the worker
                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    `${window.location.origin}/pdf.worker.min.mjs`;

                const pdf = await pdfjsLib.getDocument(url).promise;

                if (cancelled) return;

                setPageCount(pdf.numPages);

                const page = await pdf.getPage(1);
                const canvas = canvasRef.current;
                if (!canvas || cancelled) return;

                const context = canvas.getContext("2d");
                if (!context) return;

                // Scale to fit card nicely (target ~400px width for good quality)
                const viewport = page.getViewport({ scale: 1 });
                const targetWidth = 400;
                const scale = targetWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;

                await page.render({
                    canvasContext: context,
                    canvas: canvas,
                    viewport: scaledViewport,
                }).promise;

                if (!cancelled) {
                    setLoaded(true);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("PDF thumbnail error:", err);
                    setError(true);
                }
            }
        }

        renderPdf();

        return () => {
            cancelled = true;
        };
    }, [url]);

    // Fallback: show icon if error
    if (error) {
        return (
            <div className={cn("w-full h-full flex flex-col items-center justify-center gap-3 bg-muted/50", className)}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10">
                    <FileText className="h-7 w-7 text-red-500" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
                    PDF
                </span>
            </div>
        );
    }

    return (
        <div className={cn("relative w-full h-full bg-white", className)}>
            {/* Canvas with PDF first page */}
            <canvas
                ref={canvasRef}
                className={cn(
                    "w-full h-full object-cover object-top transition-opacity duration-300",
                    loaded ? "opacity-100" : "opacity-0"
                )}
                style={{ objectFit: "cover", objectPosition: "top" }}
            />

            {/* Loading placeholder */}
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                </div>
            )}

            {/* Page count badge */}
            {pageCount !== null && (
                <div className="absolute bottom-2 left-2 z-10">
                    <Badge
                        variant="secondary"
                        className="backdrop-blur-md bg-black/50 text-white border-0 text-[10px] font-medium"
                    >
                        {pageCount} {pageCount === 1 ? "página" : "páginas"}
                    </Badge>
                </div>
            )}
        </div>
    );
}

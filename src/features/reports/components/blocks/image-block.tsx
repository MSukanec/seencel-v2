"use client";

import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import type { BlockConfig } from "../../views/reports-builder-view";

interface ImageBlockProps {
    config: BlockConfig;
}

export function ImageBlock({ config }: ImageBlockProps) {
    const { title, imageUrl } = config;

    return (
        <div className="space-y-2">
            {title && (
                <h4 className="font-semibold text-sm">{title}</h4>
            )}

            {imageUrl ? (
                <div className="relative w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={title || "Imagen del informe"}
                        className="max-w-full h-auto rounded-lg object-contain mx-auto"
                        style={{ maxHeight: "300px" }}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground/70 text-center">
                        Configurá la URL de la imagen en el panel derecho
                    </p>
                </div>
            )}
        </div>
    );
}

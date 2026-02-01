"use client";

import { ReactNode, useRef, useState } from "react";
import { CustomizationProvider } from "../provider";
import { PalettePlayground } from "./palette-playground";
import { Button } from "@/components/ui/button";
import { Palette, X } from "lucide-react";

/**
 * Client Wrapper for Customization with Palette Playground
 * 
 * Wraps content with the customization provider and shows floating palette panel.
 * Use this in Server Components that need customization features.
 */

interface CustomizationClientWrapperProps {
    children: ReactNode;
    /** Show the palette playground panel */
    showPlayground?: boolean;
}

export function CustomizationClientWrapper({
    children,
    showPlayground = true
}: CustomizationClientWrapperProps) {
    const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    return (
        <CustomizationProvider>
            <div ref={wrapperRef} className="relative">
                {children}

                {/* Floating toggle button */}
                {showPlayground && (
                    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
                        {/* Playground panel */}
                        {isPlaygroundOpen && (
                            <PalettePlayground targetRef={wrapperRef} />
                        )}

                        {/* Toggle button */}
                        <Button
                            variant={isPlaygroundOpen ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
                            className="gap-2 shadow-lg"
                        >
                            {isPlaygroundOpen ? (
                                <>
                                    <X className="h-4 w-4" />
                                    Cerrar
                                </>
                            ) : (
                                <>
                                    <Palette className="h-4 w-4" />
                                    Paleta
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </CustomizationProvider>
    );
}

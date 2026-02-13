"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { compressImage, type ImagePreset } from "@/lib/client-image-compression";

// ============================================================================
// Types
// ============================================================================

interface ImageUploaderProps {
    /** Current image URL to display */
    currentImageUrl?: string | null;
    /** Fallback initials or text when no image */
    fallback?: string;
    /** Fallback icon when no image (alternative to text) */
    fallbackIcon?: React.ReactNode;
    /** Server action: receives compressed File, returns { success, url?, path?, error? } */
    onUpload: (file: File) => Promise<{ success: boolean; url?: string; path?: string; error?: string }>;
    /** Callback when image is successfully uploaded — receives the URL or path */
    onSuccess?: (result: string) => void;
    /** Callback to remove current image */
    onRemove?: () => void;
    /** Compression preset (default: 'avatar') */
    compressionPreset?: ImagePreset;
    /** Size of the avatar (default: 'lg') */
    size?: "sm" | "md" | "lg" | "xl";
    /** Accepted file types (default: image/png, image/jpeg, image/webp) */
    accept?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Additional className for the container */
    className?: string;
    /** Label for the upload button (if shown) */
    buttonLabel?: string;
    /** Hint text below the button */
    hint?: string;
    /** Show external button below avatar */
    showButton?: boolean;
    /** Optional ID for the hidden input (for external triggering) */
    inputId?: string;
}

// ============================================================================
// Size Config
// ============================================================================

const SIZE_CONFIG = {
    sm: { avatar: "h-16 w-16", icon: "h-5 w-5", text: "text-lg", remove: "h-5 w-5" },
    md: { avatar: "h-20 w-20", icon: "h-6 w-6", text: "text-xl", remove: "h-5 w-5" },
    lg: { avatar: "h-24 w-24", icon: "h-8 w-8", text: "text-2xl", remove: "h-6 w-6" },
    xl: { avatar: "h-32 w-32", icon: "h-10 w-10", text: "text-3xl", remove: "h-6 w-6" },
} as const;

// ============================================================================
// Component
// ============================================================================

export function ImageUploader({
    currentImageUrl,
    fallback,
    fallbackIcon,
    onUpload,
    onSuccess,
    onRemove,
    compressionPreset = "avatar",
    size = "lg",
    accept = "image/png, image/jpeg, image/webp",
    disabled = false,
    className,
    buttonLabel,
    hint,
    showButton = false,
    inputId,
}: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const sizeConfig = SIZE_CONFIG[size];
    const displayUrl = previewUrl || currentImageUrl;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optimistic preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setIsUploading(true);

        try {
            // Always compress
            const compressedFile = await compressImage(file, compressionPreset);

            const result = await onUpload(compressedFile);

            if (result.success) {
                const resultValue = result.url || result.path || "";
                setPreviewUrl(null); // Clear preview, use real URL
                onSuccess?.(resultValue);
                toast.success("Imagen subida correctamente");
            } else {
                setPreviewUrl(null); // Revert preview
                toast.error(result.error || "Error al subir imagen");
            }
        } catch (error) {
            console.error("[ImageUploader] Upload error:", error);
            setPreviewUrl(null); // Revert preview
            toast.error("Error inesperado al subir imagen");
        } finally {
            setIsUploading(false);
            URL.revokeObjectURL(objectUrl);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        onRemove?.();
    };

    const handleClick = () => {
        if (!isUploading && !disabled) {
            inputRef.current?.click();
        }
    };

    return (
        <div className={`flex flex-col items-center gap-4 ${className || ""}`}>
            <div className="relative group">
                {/* Clickable Avatar Container */}
                <div
                    onClick={handleClick}
                    className={`relative ${!disabled ? "cursor-pointer" : "cursor-default"}`}
                >
                    <Avatar className={`${sizeConfig.avatar} border-2 border-border shadow-sm bg-muted transition-opacity group-hover:opacity-80 rounded-lg`}>
                        <AvatarImage src={displayUrl || ""} className="object-cover" />
                        <AvatarFallback className={`${sizeConfig.text} font-semibold text-muted-foreground w-full h-full flex items-center justify-center bg-muted/50 rounded-lg`}>
                            {fallbackIcon || fallback || "?"}
                        </AvatarFallback>
                    </Avatar>

                    {/* Hover Overlay with Camera Icon */}
                    {!isUploading && !disabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className={`${sizeConfig.icon} text-white`} />
                        </div>
                    )}

                    {/* Loading Spinner */}
                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                            <Loader2 className={`${sizeConfig.icon} text-white animate-spin`} />
                        </div>
                    )}
                </div>

                {/* Remove Button (appears on hover) */}
                {displayUrl && onRemove && !isUploading && !disabled && (
                    <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className={`absolute -top-1 -right-1 ${sizeConfig.remove} rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity`}
                        onClick={handleRemove}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Optional External Button */}
            {showButton && (
                <div className="text-center">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleClick}
                        disabled={isUploading || disabled}
                    >
                        <Camera className="h-3 w-3 mr-1.5" />
                        {buttonLabel || "Cambiar imagen"}
                    </Button>
                    {hint && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                            {hint}
                        </p>
                    )}
                </div>
            )}

            {/* Hidden File Input */}
            <input
                id={inputId}
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                accept={accept}
                className="hidden"
                disabled={disabled}
            />
        </div>
    );
}

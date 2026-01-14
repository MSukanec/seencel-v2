"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadContactAvatar } from "@/actions/contacts";
import { getStorageUrl } from "@/lib/storage-utils";
import { compressImage } from "@/lib/client-image-compression";

interface ContactAvatarManagerProps {
    currentPath?: string | null;
    initials: string;
    onPathChange: (path: string | null) => void;
}

export function ContactAvatarManager({ currentPath, initials, onPathChange }: ContactAvatarManagerProps) {
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Calculate URL: if currentPath is a raw path, convert to URL. if http, keep it.
    const avatarUrl = currentPath ? getStorageUrl(currentPath, 'avatars') : null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            // Compress image using 'avatar' preset (512px, 0.5MB max)
            const compressedFile = await compressImage(file, 'avatar');

            const formData = new FormData();
            formData.append('file', compressedFile);

            const result = await uploadContactAvatar(formData);
            if (result.success && result.path) {
                onPathChange(result.path);
                toast.success("Imagen subida correctamente");
            } else {
                toast.error(result.error || "Error al subir imagen");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error inesperado al subir imagen");
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering upload
        onPathChange(null);
    };

    const handleClick = () => {
        if (!isUploading) {
            inputRef.current?.click();
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                {/* Clickable Avatar Container */}
                <div
                    onClick={handleClick}
                    className="relative cursor-pointer"
                >
                    <Avatar className="h-24 w-24 border-2 border-border shadow-sm bg-muted transition-opacity group-hover:opacity-80">
                        <AvatarImage src={avatarUrl || ""} className="object-cover" />
                        <AvatarFallback className="text-2xl font-semibold text-muted-foreground w-full h-full flex items-center justify-center bg-muted/50">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Hover Overlay with Camera Icon */}
                    {!isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    )}

                    {/* Loading Spinner */}
                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {/* Remove Button (appears on hover) */}
                {currentPath && !isUploading && (
                    <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemove}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
            />
        </div>
    );
}

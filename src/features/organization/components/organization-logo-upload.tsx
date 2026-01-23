"use client";

import { useState, useRef, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadOrganizationLogo } from "@/actions/upload-logo";
import { toast } from "sonner"; // Assuming sonner or useToast

interface OrganizationLogoUploadProps {
    organizationId: string;
    initialLogoUrl?: string | null;
    organizationName?: string;
}

export function OrganizationLogoUpload({ organizationId, initialLogoUrl, organizationName }: OrganizationLogoUploadProps) {
    const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl || null);
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optimistic Preview
        const objectUrl = URL.createObjectURL(file);
        setLogoUrl(objectUrl);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("organizationId", organizationId);

        startTransition(async () => {
            const result = await uploadOrganizationLogo(formData);
            if (result.error) {
                // Revert
                setLogoUrl(initialLogoUrl || null);
                // Try to use toast if available, or alert
                alert("Error subiendo logo: " + result.error);
            } else {
                // Success
                setLogoUrl(result.logoUrl!);
            }
        });
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-border shadow-md rounded-lg">
                    <AvatarImage src={logoUrl || ""} className="object-cover" />
                    <AvatarFallback className="text-xl bg-muted">
                        {organizationName?.substring(0, 2).toUpperCase() || "OR"}
                    </AvatarFallback>
                </Avatar>

                {/* Overlay Button */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                    onClick={() => inputRef.current?.click()}
                >
                    {isPending ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                        <Camera className="w-6 h-6 text-white" />
                    )}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isPending}
            />

            <div className="text-center">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => inputRef.current?.click()}
                    disabled={isPending}
                >
                    <Upload className="w-3 h-3 mr-2" />
                    Cambiar Logo
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">
                    Máx. 2MB. PNG, JPG.
                </p>
            </div>
        </div>
    );
}


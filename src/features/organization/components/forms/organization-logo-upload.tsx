"use client";

import { ImageUploader } from "@/components/shared/image-uploader";
import { uploadOrganizationLogo } from "@/actions/upload-logo";
import { Building2 } from "lucide-react";

interface OrganizationLogoUploadProps {
    organizationId: string;
    initialLogoUrl?: string | null;
    organizationName?: string;
}

export function OrganizationLogoUpload({ organizationId, initialLogoUrl, organizationName }: OrganizationLogoUploadProps) {
    return (
        <ImageUploader
            currentImageUrl={initialLogoUrl}
            fallback={organizationName?.substring(0, 2).toUpperCase() || "OR"}
            onUpload={async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("organizationId", organizationId);
                const result = await uploadOrganizationLogo(formData);
                return {
                    success: result.success ?? !result.error,
                    url: result.logoUrl ?? undefined,
                    error: result.error ?? undefined,
                };
            }}
            compressionPreset="avatar"
            showButton
            buttonLabel="Cambiar Logo"
            hint="Máx. 2MB. PNG, JPG."
        />
    );
}

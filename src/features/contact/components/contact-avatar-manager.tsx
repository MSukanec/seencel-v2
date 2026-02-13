"use client";

import { ImageUploader } from "@/components/shared/image-uploader";
import { uploadContactAvatar } from "@/actions/contacts";
import { getStorageUrl } from "@/lib/storage-utils";

interface ContactAvatarManagerProps {
    currentPath?: string | null;
    initials: string;
    onPathChange: (path: string | null) => void;
}

export function ContactAvatarManager({ currentPath, initials, onPathChange }: ContactAvatarManagerProps) {
    const avatarUrl = currentPath ? getStorageUrl(currentPath, 'avatars') : null;

    return (
        <ImageUploader
            currentImageUrl={avatarUrl}
            fallback={initials}
            onUpload={async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                const result = await uploadContactAvatar(formData);
                return {
                    success: result.success ?? false,
                    path: result.path ?? undefined,
                    error: result.error ?? undefined,
                };
            }}
            onSuccess={(path) => onPathChange(path)}
            onRemove={() => onPathChange(null)}
            compressionPreset="avatar"
        />
    );
}

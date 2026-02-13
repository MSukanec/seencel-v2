"use client"

import { useTransition } from "react"
import { ImageUploader } from "@/components/shared/image-uploader"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Camera, ImagePlus, Trash2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { uploadAvatar, removeAvatar, restoreProviderAvatar } from "../actions"
import { useTranslations } from "next-intl"

interface AvatarManagerProps {
    avatarUrl: string | null
    fullName: string | null
    initials: string
}

const AVATAR_INPUT_ID = "user-avatar-upload-input";

export function AvatarManager({ avatarUrl, fullName, initials }: AvatarManagerProps) {
    const t = useTranslations('Settings.Profile.Avatar')
    const [isPending, startTransition] = useTransition()

    const handleDelete = () => {
        const promise = new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    await removeAvatar()
                    resolve(true)
                } catch (error) {
                    reject(error)
                }
            })
        })

        toast.promise(promise, {
            loading: t('deleting'),
            success: t('successDelete'),
            error: t('errorDelete'),
        })
    }

    const handleRestore = () => {
        const promise = new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    await restoreProviderAvatar()
                    resolve(true)
                } catch (error) {
                    reject(error)
                }
            })
        })

        toast.promise(promise, {
            loading: t('restoring'),
            success: t('successRestore'),
            error: t('errorRestore'),
        })
    }

    const triggerFileInput = () => {
        document.getElementById(AVATAR_INPUT_ID)?.click()
    }

    return (
        <div className="flex items-center gap-x-8">
            <ImageUploader
                currentImageUrl={avatarUrl}
                fallback={initials}
                inputId={AVATAR_INPUT_ID}
                onUpload={async (file) => {
                    const formData = new FormData()
                    formData.append('file', file)
                    const result = await uploadAvatar(formData)
                    return {
                        success: result.success ?? false,
                        url: result.avatar_url ?? undefined,
                        error: result.error ?? undefined,
                    }
                }}
                compressionPreset="avatar"
                disabled={isPending}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isPending} className="flex gap-2">
                        <Camera className="h-4 w-4" />
                        {t('change')}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={triggerFileInput}>
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {t('upload')}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleRestore}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t('restore')}
                    </DropdownMenuItem>

                    {avatarUrl && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('delete')}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

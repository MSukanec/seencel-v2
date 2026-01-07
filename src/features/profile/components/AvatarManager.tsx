"use client"

import { useState, useRef, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Camera, ImagePlus, Loader2, Trash2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { uploadAvatar, removeAvatar, restoreProviderAvatar } from "../actions"
import { useTranslations } from "next-intl"

interface AvatarManagerProps {
    avatarUrl: string | null
    fullName: string | null
    initials: string
}

export function AvatarManager({ avatarUrl, fullName, initials }: AvatarManagerProps) {
    const t = useTranslations('Settings.Profile.Avatar') // Assuming new keys I'll add
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('errorSize'))
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        const promise = new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    const result = await uploadAvatar(formData)
                    if (result.success) {
                        resolve(true)
                    } else {
                        reject(new Error(result.error || t('errorUpload')))
                    }
                } catch (error) {
                    reject(error)
                }
            })
        })

        toast.promise(promise, {
            loading: t('uploading'),
            success: t('successUpload'),
            error: t('errorUpload'),
        })
    }

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

    return (
        <div className="flex items-center gap-x-8">
            <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                    {/* Optimistic UI: If pending, show global spinner overlay? Or relies on toast/revalidate */}
                    <AvatarImage src={avatarUrl || ""} alt={fullName || "User"} className="object-cover" />
                    <AvatarFallback className="text-2xl font-semibold bg-muted text-muted-foreground">
                        {initials}
                    </AvatarFallback>

                    {isPending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full z-10">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                    )}
                </Avatar>
            </div>

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

                    <DropdownMenuItem onClick={() => inputRef.current?.click()}>
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

            {/* Hidden Input */}
            <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
            />
        </div>
    )
}

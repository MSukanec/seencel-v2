"use client";

import { UploadCloud, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { twMerge } from "tailwind-merge";

const variants = {
    base: "relative flex flex-col items-center justify-center w-full rounded-md border border-input bg-background p-6 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer hover:bg-accent/50",
    image:
        "border-0 p-0 relative shadow-md bg-slate-200 dark:bg-slate-900 rounded-md",
    active: "border-primary bg-primary/5 ring-1 ring-primary",
    disabled:
        "bg-muted border-muted-foreground/20 cursor-default pointer-events-none opacity-50",
    accept: "border-primary bg-primary/5 ring-1 ring-primary",
    reject: "border-destructive bg-destructive/10 ring-1 ring-destructive",
};

type InputProps = {
    width?: number;
    height?: number;
    className?: string;
    value?: File | string;
    onChange?: (file?: File) => void | Promise<void>;
    disabled?: boolean;
    dropzoneOptions?: Omit<DropzoneOptions, "disabled">;
    dropzoneLabel?: string;
};

const ERROR_MESSAGES = {
    fileTooLarge(maxSize: number) {
        return `The file is too large. Max size is ${formatFileSize(maxSize)}.`;
    },
    fileInvalidType() {
        return "Invalid file type.";
    },
    tooManyFiles(maxFiles: number) {
        return `You can only add ${maxFiles} file(s).`;
    },
    fileNotSupported() {
        return "The file is not supported.";
    },
};

const SingleImageDropzone = React.forwardRef<HTMLInputElement, InputProps>(
    (
        { dropzoneOptions, width, height, value, className, disabled, onChange, dropzoneLabel },
        ref,
    ) => {
        const imageUrl = React.useMemo(() => {
            if (typeof value === "string") {
                // in case an url is passed in, use it to display the image
                return value;
            } else if (value) {
                // in case a file is passed in, create a preview url
                return URL.createObjectURL(value);
            }
            return null;
        }, [value]);

        // dropzone configuration
        const {
            getRootProps,
            getInputProps,
            isDragActive,
            isDragAccept,
            isDragReject,
            fileRejections,
        } = useDropzone({
            accept: { "image/*": [] },
            multiple: false,
            disabled,
            onDrop: (acceptedFiles) => {
                const file = acceptedFiles[0];
                if (file) {
                    void onChange?.(file);
                }
            },
            ...dropzoneOptions,
        });

        // styling
        const dropZoneClassName = React.useMemo(
            () =>
                twMerge(
                    variants.base,
                    isDragActive && variants.active,
                    isDragAccept && variants.accept,
                    isDragReject && variants.reject,
                    disabled && variants.disabled,
                    imageUrl && variants.image,
                    className,
                ).trim(),
            [
                isDragActive,
                isDragAccept,
                isDragReject,
                disabled,
                imageUrl,
                className,
            ],
        );

        // error validation messages
        const errorMessage = React.useMemo(() => {
            if (fileRejections[0]) {
                const { errors } = fileRejections[0];
                if (errors[0]?.code === "file-too-large") {
                    return ERROR_MESSAGES.fileTooLarge(dropzoneOptions?.maxSize ?? 0);
                } else if (errors[0]?.code === "file-invalid-type") {
                    return ERROR_MESSAGES.fileInvalidType();
                } else if (errors[0]?.code === "too-many-files") {
                    return ERROR_MESSAGES.tooManyFiles(dropzoneOptions?.maxFiles ?? 0);
                } else {
                    return ERROR_MESSAGES.fileNotSupported();
                }
            }
            return undefined;
        }, [fileRejections, dropzoneOptions]);

        return (
            <div className="relative group">
                <div
                    {...getRootProps({
                        className: dropZoneClassName,
                        style: {
                            width,
                            height,
                        },
                    })}
                >
                    {/* Main File Input */}
                    <input ref={ref} {...getInputProps()} />

                    {imageUrl ? (
                        // Image Preview with hover overlay
                        <>
                            <img
                                className="h-full w-full rounded-md object-cover"
                                src={imageUrl}
                                alt={typeof value === "string" ? value : value?.name}
                            />
                            {/* Hover overlay with actions */}
                            {!disabled && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md">
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center gap-1 text-white/90 hover:text-white cursor-pointer">
                                            <UploadCloud className="h-6 w-6" />
                                            <span className="text-xs font-medium">Cambiar</span>
                                        </div>
                                        <div
                                            className="flex flex-col items-center gap-1 text-white/90 hover:text-destructive cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void onChange?.(undefined);
                                            }}
                                        >
                                            <X className="h-6 w-6" />
                                            <span className="text-xs font-medium">Borrar</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Upload Prompt - styled like MultiFileUpload
                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <UploadCloud className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="font-medium text-foreground">
                                    <span className="text-primary hover:underline">Haz clic</span> o arrastra imagen
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {dropzoneLabel || "PNG, JPG, WEBP hasta 10MB"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Text */}
                <div className="mt-1 text-xs text-red-500">{errorMessage}</div>
            </div>
        );
    },
);
SingleImageDropzone.displayName = "SingleImageDropzone";

function formatFileSize(bytes?: number) {
    if (!bytes) {
        return "0 Bytes";
    }
    bytes = Number(bytes);
    if (bytes === 0) {
        return "0 Bytes";
    }
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export { SingleImageDropzone };


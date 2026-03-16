/**
 * Creator Column Factory
 * Standard 19.1 - Reusable Creator/Avatar Column
 * 
 * Creates a compact column showing only the creator's avatar.
 * The full name appears on hover via tooltip.
 */

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CreatorColumnOptions<TData> {
    /** Column header title (default: "Creador") */
    title?: string;
    /** Key for avatar URL in row data (default: "creator_avatar_url") */
    avatarUrlKey?: keyof TData | string;
    /** Key for full name in row data (default: "creator_full_name") */
    nameKey?: keyof TData | string;
    /** Enable sorting (default: false) */
    enableSorting?: boolean;
    /** Column width in px (default: 50) */
    size?: number;
}

// ─── Factory ─────────────────────────────────────────────

export function createCreatorColumn<TData>(
    options: CreatorColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        title = "Creador",
        avatarUrlKey = "creator_avatar_url",
        nameKey = "creator_full_name",
        enableSorting = false,
        size = 50,
    } = options;

    const accessorKey = nameKey as string;

    return {
        accessorKey,
        header: () => null,
        cell: ({ row }) => {
            const avatarUrl = (row.original as any)[avatarUrlKey as string] || null;
            const fullName = (row.original as any)[nameKey as string] || null;

            const initials = fullName
                ? fullName
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "?";

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center justify-center">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={avatarUrl || undefined} />
                                    <AvatarFallback className="text-[10px] bg-muted">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{fullName || "Desconocido"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting,
        size,
    };
}

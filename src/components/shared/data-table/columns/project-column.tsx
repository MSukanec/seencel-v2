/**
 * Project Column Factory
 * Standard 19.2 - Reusable Project Column
 *
 * Creates a standardized project column showing:
 * - Project color dot or image as avatar
 * - Project name
 * - Sortable by project_name
 *
 * Designed for use in organization context tables where
 * data spans multiple projects.
 */

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ProjectColumnOptions<TData> {
    /** Column accessor key for project name (default: "project_name") */
    accessorKey?: string;
    /** Column header title (default: "Proyecto") */
    title?: string;
    /** Function to get project image URL from row */
    getImageUrl?: (row: TData) => string | null | undefined;
    /** Function to get project color from row */
    getColor?: (row: TData) => string | null | undefined;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Value to show when no project (default: "Sin proyecto") */
    emptyValue?: string;
}

/**
 * Creates a project column with avatar (color dot or image) + name
 */
export function createProjectColumn<TData>(
    options: ProjectColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "project_name",
        title = "Proyecto",
        getImageUrl = (row: any) => row.project_image_url,
        getColor = (row: any) => row.project_color,
        enableSorting = true,
        emptyValue = "Sin proyecto",
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const name = row.getValue(accessorKey) as string | null | undefined;
            const imageUrl = getImageUrl(row.original);
            const color = getColor(row.original);

            if (!name) {
                return (
                    <span className="text-muted-foreground italic text-sm">
                        {emptyValue}
                    </span>
                );
            }

            const initials = name.substring(0, 2).toUpperCase();

            return (
                <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 rounded-md border border-border/50">
                        {imageUrl ? (
                            <AvatarImage src={imageUrl} alt={name} className="object-cover" />
                        ) : null}
                        <AvatarFallback
                            className="rounded-md text-[9px] font-bold text-white"
                            style={{
                                backgroundColor: color || "hsl(var(--primary))",
                            }}
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate max-w-[160px]" title={name}>
                        {name}
                    </span>
                </div>
            );
        },
        enableSorting,
    };
}

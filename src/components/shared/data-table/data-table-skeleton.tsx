import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface DataTableSkeletonProps {
    columnCount: number;
    rowCount?: number;
}

export function DataTableSkeleton({
    columnCount,
    rowCount = 5,
}: DataTableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                    {Array.from({ length: columnCount }).map((_, j) => (
                        <TableCell key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

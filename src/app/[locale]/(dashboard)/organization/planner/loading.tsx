import { Skeleton } from "@/components/ui/skeleton";

export default function PlannerLoading() {
    return (
        <div className="flex flex-col h-full">
            {/* Header: Title + Tabs */}
            <div className="flex items-center gap-4 px-6 pt-4 pb-2 border-b">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-24" />
                <div className="flex gap-4 ml-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 px-6 py-3">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-48 rounded-md" />
            </div>

            {/* Calendar Grid Skeleton */}
            <div className="flex-1 px-6 pb-6">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-px mb-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 rounded" />
                    ))}
                </div>
                {/* Calendar rows */}
                <div className="grid grid-cols-7 gap-px flex-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded" />
                    ))}
                </div>
            </div>
        </div>
    );
}

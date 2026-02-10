import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationLoading() {
    return (
        <div className="h-full flex flex-col">
            {/* Header skeleton */}
            <div className="border-b border-border/40 p-6">
                <div className="flex items-center gap-5">
                    <Skeleton className="h-20 w-20 rounded-xl" />
                    <div className="space-y-3">
                        <Skeleton className="h-9 w-80" />
                        <Skeleton className="h-5 w-60" />
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 space-y-8">
                {/* KPI Grid skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>

                {/* Main content skeleton (2 columns) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. Header & Actions Loading */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-10 w-64 md:w-96" />
                    <Skeleton className="h-6 w-80 md:w-[30rem]" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-32 hidden sm:block" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* 2. KPI Grid Loading */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
            </div>

            {/* 3. Main Content Loading */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="xl:col-span-2 space-y-6">
                    <Skeleton className="h-[400px] rounded-2xl" />
                    <Skeleton className="h-[300px] rounded-2xl" />
                </div>

                {/* Sidebar/Activity Area */}
                <div className="space-y-6">
                    <Skeleton className="h-[250px] rounded-2xl" />
                    <Skeleton className="h-[400px] rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

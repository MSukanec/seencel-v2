import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";

export default function SubcontractsLoading() {
    return (
        <PageWrapper
            type="page"
            title="Cargando..."
            icon={<Skeleton className="h-10 w-10 rounded-lg" />}
        >
            <ContentLayout variant="wide">
                <div className="space-y-4">
                    {/* Toolbar Skeleton */}
                    <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-10 w-32" />
                    </div>

                    {/* Cards Skeleton */}
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border rounded-xl bg-card">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <div className="hidden md:flex gap-8">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}

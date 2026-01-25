import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";

export default function ProjectDashboardLoading() {
    return (
        <PageWrapper
            type="page"
            title={<Skeleton className="h-8 w-48" />}
            description={<Skeleton className="h-4 w-96" />}
            icon={<Skeleton className="h-10 w-10 rounded-lg" />}
        >
            <ContentLayout variant="standard">
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-6 border rounded-xl space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4 p-6 border rounded-xl h-[400px]">
                            <Skeleton className="h-full w-full" />
                        </div>
                        <div className="col-span-3 p-6 border rounded-xl h-[400px]">
                            <Skeleton className="h-full w-full" />
                        </div>
                    </div>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}

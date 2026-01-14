import { FoundersContent } from "@/features/founders/components/founders-content";

export default function DashboardFoundersPage() {
    return (
        <div className="h-full overflow-auto">
            <FoundersContent isDashboard={true} />
        </div>
    );
}

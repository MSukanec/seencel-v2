import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Portal del Cliente"
            messages={[
                "Preparando el portal de tu cliente…",
                "Organizando la vista compartida…",
            ]}
        />
    );
}

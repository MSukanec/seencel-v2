import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Archivos"
            messages={[
                "Reuniendo tus documentos…",
                "Organizando archivos del equipo…",
                "Preparando tu biblioteca…",
            ]}
        />
    );
}

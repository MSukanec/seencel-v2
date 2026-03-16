import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Archivos"
            messages={[
                "Reuniendo tus archivos…",
                "Organizando archivos del equipo…",
                "Preparando tu biblioteca de archivos…",
            ]}
        />
    );
}

import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Archivos"
            messages={[
                "Reuniendo documentos del proyecto…",
                "Preparando planos y archivos…",
                "Organizando la memoria técnica…",
            ]}
        />
    );
}

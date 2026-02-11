import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Contactos"
            messages={[
                "Reuniendo tu red de contactos…",
                "Preparando proveedores y socios…",
                "Conectando personas con proyectos…",
            ]}
        />
    );
}

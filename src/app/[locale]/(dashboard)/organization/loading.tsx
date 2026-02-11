import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Visión General"
            messages={[
                "Preparando el panorama de tu organización…",
                "Reuniendo datos de todos tus proyectos…",
                "Ajustando el caos del mundo real…",
            ]}
        />
    );
}

import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Tareas de Construcción"
            messages={[
                "Ordenando la obra…",
                "Cargando tareas y recursos…",
                "Armando el rompecabezas constructivo…",
            ]}
        />
    );
}

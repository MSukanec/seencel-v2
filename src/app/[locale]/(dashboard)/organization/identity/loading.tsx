import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Identidad"
            messages={[
                "Cargando el perfil de tu organización…",
                "Preparando tu identidad corporativa…",
            ]}
        />
    );
}

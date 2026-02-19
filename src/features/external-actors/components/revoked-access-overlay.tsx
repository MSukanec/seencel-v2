"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldOff, ArrowRight } from "lucide-react";

interface RevokedAccessOverlayProps {
    externalActorType: string | null;
}

const ACTOR_LABELS: Record<string, string> = {
    client: "el portal de cliente",
    accountant: "el portal de contador",
    field_worker: "el portal de campo",
    external_site_manager: "el portal de director de obra",
    subcontractor_portal_user: "el portal de subcontratista",
};

export function RevokedAccessOverlay({ externalActorType }: RevokedAccessOverlayProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const portalLabel = externalActorType ? (ACTOR_LABELS[externalActorType] ?? "el portal") : "el portal";

    const handleGoToHub = () => {
        startTransition(() => {
            // Redirect to the hub — the user may still have personal access
            router.push("/");
            router.refresh();
        });
    };

    return (
        <AlertDialog open={true}>
            <AlertDialogContent
                className="max-w-md"
                onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}
            >
                <AlertDialogHeader className="items-center text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <ShieldOff className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <AlertDialogTitle className="text-lg">
                        Tu acceso fue revocado
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-sm">
                            <p>
                                Un administrador te ha removido de {portalLabel}.
                                Ya no tenés acceso a esta organización.
                            </p>
                            <ul className="space-y-1.5 text-left">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Tu cuenta personal no fue afectada.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Podés ser re-invitado en cualquier momento.</span>
                                </li>
                            </ul>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center">
                    <AlertDialogAction
                        onClick={handleGoToHub}
                        disabled={isPending}
                        className="gap-2"
                    >
                        {isPending ? (
                            "Redirigiendo..."
                        ) : (
                            <>
                                Ir al Hub
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { switchOrganization } from "@/features/organization/actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserX, ArrowRight } from "lucide-react";

interface MemberRemovedOverlayProps {
    fallbackOrgId: string;
    fallbackOrgName: string;
}

export function MemberRemovedOverlay({ fallbackOrgId, fallbackOrgName }: MemberRemovedOverlayProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleSwitch = () => {
        startTransition(async () => {
            await switchOrganization(fallbackOrgId);
            router.push("/organization");
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
                        <UserX className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <AlertDialogTitle className="text-lg">
                        Ya no sos miembro de esta organización
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-sm">
                            <p>
                                Un administrador te ha removido de esta organización.
                                Ya no tenés acceso a sus proyectos ni datos.
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
                        onClick={handleSwitch}
                        disabled={isPending}
                        className="gap-2"
                    >
                        {isPending ? (
                            "Redirigiendo..."
                        ) : (
                            <>
                                Ir a {fallbackOrgName}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

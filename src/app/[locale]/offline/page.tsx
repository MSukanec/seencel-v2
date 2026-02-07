"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <WifiOff className="w-10 h-10 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Sin conexión</h1>
                    <p className="text-muted-foreground">
                        Parece que no tienes conexión a internet. Verifica tu conexión e intenta nuevamente.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button onClick={() => window.location.reload()}>
                        Reintentar
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/">Ir al inicio</Link>
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Algunas funciones pueden estar disponibles sin conexión.
                </p>
            </div>
        </div>
    );
}

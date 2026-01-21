"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wrench, Home, RefreshCw, Coffee } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md w-full">
                {/* Visual Element */}
                <div className="relative flex justify-center">
                    <div className="text-[6rem] font-bold text-muted/20 leading-none select-none">
                        🔧
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-4 rounded-full border shadow-sm animate-pulse">
                        <Wrench className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Estamos mejorando
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        El dashboard está en mantenimiento
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Estamos haciendo algunas mejoras para vos.
                        <br />
                        Volvé en unos minutos, ¡prometemos que valdrá la pena!
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Coffee className="h-4 w-4" />
                    <span>Tiempo para un cafecito ☕</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                    <Button asChild variant="default" size="lg">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Ir al Inicio
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reintentar
                    </Button>
                </div>

                <div className="pt-12 text-xs text-muted-foreground font-mono">
                    Código de estado: MAINTENANCE_MODE
                </div>
            </div>
        </div>
    );
}

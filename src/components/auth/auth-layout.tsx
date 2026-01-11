"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    mode: "login" | "register";
}

export function AuthLayout({ children, title, description, mode }: AuthLayoutProps) {
    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">

            {/* Left Side - Hero (Originally Right) */}
            <div className="hidden bg-muted lg:block relative h-full overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900" />

                {/* Abstract Pattern / Gradient */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right_bottom,rgba(255,255,255,0.05)_0%,transparent_40%,transparent_100%)]" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-20 flex h-full flex-col justify-between p-12 text-white">
                    <div className="flex items-center gap-3 font-medium text-lg">
                        <div className="relative h-8 w-8">
                            <Image
                                src="/logo.png"
                                alt="SEENCEL"
                                fill
                                className="object-contain"
                            />
                        </div>
                        SEENCEL
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <blockquote className="space-y-2">
                            <p className="text-2xl font-medium leading-tight text-white/90">
                                "La plataforma definitiva para gestionar y escalar tus proyectos de arquitectura, diseño y construcción con precisión y elegancia."
                            </p>
                            <footer className="text-sm text-white/60">
                                El estándar de la industria
                            </footer>
                        </blockquote>
                        <div className="flex gap-2">
                            <div className="h-1 w-8 rounded-full bg-white transition-all hover:w-12" />
                            <div className="h-1 w-2 rounded-full bg-white/30" />
                            <div className="h-1 w-2 rounded-full bg-white/30" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form (Originally Left) */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
                {/* Subtle ambient background effects for the form side */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                <div className="mx-auto w-full max-w-[400px] gap-6 flex flex-col relative z-10">
                    <div className="flex flex-col gap-2 text-center mb-6">
                        <div className="mx-auto mb-4 h-12 w-12 relative flex items-center justify-center">
                            <Image
                                src="/logo.png"
                                alt="SEENCEL"
                                width={60}
                                height={60}
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {children}

                    <div className="mt-6 text-center text-sm">
                        {mode === "login" ? (
                            <p className="text-muted-foreground">
                                ¿No tienes una cuenta?{" "}
                                <Link href="/signup" className="font-medium text-primary hover:underline underline-offset-4">
                                    Regístrate
                                </Link>
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                ¿Ya tienes una cuenta?{" "}
                                <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
                                    Inicia sesión
                                </Link>
                            </p>
                        )}
                    </div>
                    <div className="mt-8 text-center text-xs text-muted-foreground">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    )
}

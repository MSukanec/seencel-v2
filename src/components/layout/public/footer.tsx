"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Twitter, Linkedin, Github, Facebook, Instagram } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
    const t = useTranslations('Common'); // Assuming Common namespace exists, or fallback to hardcoded for now if needed.
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur-sm pt-16 pb-8">
            <div className="container px-4 md:px-6 mx-auto max-w-[1920px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="relative h-8 w-8">
                                <Image
                                    src="/logo.png"
                                    alt="SEENCEL"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-bold text-xl tracking-tighter">
                                SEENCEL
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Gestión avanzada para la construcción. Optimizando proyectos, finanzas y operaciones en una sola plataforma unificada.
                        </p>
                    </div>

                    {/* Product Column */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground tracking-tight">Producto</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="/#features" className="hover:text-primary transition-colors">Características</a>
                            </li>
                            <li>
                                <Link href="/pricing" className="hover:text-primary transition-colors">Precios</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground tracking-tight">Compañía</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/contact" className="hover:text-primary transition-colors">Contacto</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Social Column */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground tracking-tight">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/privacy" className="hover:text-primary transition-colors">
                                    {t('privacyPolicy')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-primary transition-colors">
                                    {t('termsOfService')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {currentYear} Seencel Inc. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}


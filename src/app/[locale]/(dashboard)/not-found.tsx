"use client";

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard, LifeBuoy } from 'lucide-react';
import { Link } from '@/i18n/routing';

/**
 * Dashboard-specific 404 page
 * Styled to match the dashboard context with navigation back to organization
 */
export default function DashboardNotFound() {
    const t = useTranslations('NotFound');

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md w-full">
                {/* Visual Element */}
                <div className="relative flex justify-center">
                    <div className="text-[10rem] font-bold text-foreground/10 leading-none select-none">
                        404
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-4 rounded-full border shadow-sm">
                        <LifeBuoy className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('description')}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                    <Button asChild variant="default" size="lg">
                        <Link href="/organization">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            {t('goDashboard')}
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/contact">
                            <LifeBuoy className="mr-2 h-4 w-4" />
                            {t('contactSupport')}
                        </Link>
                    </Button>
                </div>

                <div className="pt-8">
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </div>

                <div className="pt-12 text-xs text-muted-foreground font-mono">
                    Error <span className="text-primary">404</span> • {t('errorCode')}
                </div>
            </div>
        </div>
    );
}

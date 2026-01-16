"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CreditCard,
    Calendar,
    FileText,
    MessageSquare,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";

// Types
export interface PortalProject {
    id: string;
    name: string;
    image_url?: string | null;
    color?: string | null;
}

export interface PortalClient {
    id: string;
    contact_full_name?: string | null;
    contact_avatar_url?: string | null;
}

export interface PortalSettings {
    show_dashboard: boolean;
    show_installments: boolean;
    show_payments: boolean;
    show_logs: boolean;
    show_amounts: boolean;
    show_progress: boolean;
    allow_comments: boolean;
}

export interface PortalData {
    payments: any[];
    schedules: any[];
    summary: {
        total_committed_amount?: number;
        total_paid_amount?: number;
        balance_due?: number;
        currency_symbol?: string;
    } | null;
}

export interface PortalBranding {
    portal_name?: string | null;
    welcome_message?: string | null;
    primary_color?: string;
    background_color?: string;
    hero_image_url?: string | null;
    show_hero?: boolean;
    show_footer?: boolean;
    footer_text?: string | null;
    show_powered_by?: boolean;
}

interface PortalShellProps {
    mode: 'preview' | 'live';
    project: PortalProject;
    client: PortalClient;
    settings: PortalSettings;
    data: PortalData;
    branding?: Partial<PortalBranding>;
    className?: string;
    isMobile?: boolean;
}

type Section = 'dashboard' | 'payments' | 'schedule' | 'logs' | 'messages';

const SECTION_CONFIG = {
    dashboard: { icon: LayoutDashboard, setting: 'show_dashboard' },
    payments: { icon: CreditCard, setting: 'show_payments' },
    schedule: { icon: Calendar, setting: 'show_installments' },
    logs: { icon: FileText, setting: 'show_logs' },
    messages: { icon: MessageSquare, setting: 'allow_comments' },
} as const;

function getInitials(name: string | null | undefined) {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function PortalShell({ mode, project, client, settings, data, branding, className, isMobile: isMobileProp }: PortalShellProps) {
    const [activeSection, setActiveSection] = useState<Section>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // If in preview mobile mode, we force mobile layout regardless of viewport width
    const forceMobile = mode === 'preview' && isMobileProp;

    const t = useTranslations('Portal');
    const primaryColor = branding?.primary_color || project.color || "#83cc16";
    const bgColor = branding?.background_color || "#09090b";
    const showFooter = branding?.show_footer ?? true;
    const showPoweredBy = branding?.show_powered_by ?? true;
    const welcomeMessage = branding?.welcome_message || t('Defaults.welcome');
    const portalName = branding?.portal_name || project.name;

    // Filter visible sections based on settings
    const visibleSections = (Object.entries(SECTION_CONFIG) as [Section, typeof SECTION_CONFIG[Section]][])
        .filter(([key, config]) => settings[config.setting as keyof PortalSettings]);

    // If current section is not visible, default to first visible
    const currentSection = visibleSections.find(([key]) => key === activeSection)
        ? activeSection
        : visibleSections[0]?.[0] || 'dashboard';

    const handleSectionChange = (section: Section) => {
        setActiveSection(section);
        setMobileMenuOpen(false);
    };

    const renderSidebar = (isMobile = false) => (
        <nav className={cn(
            "flex flex-col gap-1 p-4",
            isMobile && "pt-8"
        )}>
            {visibleSections.map(([key, config]) => {
                const Icon = config.icon;
                const isActive = currentSection === key;
                return (
                    <button
                        key={key}
                        onClick={() => handleSectionChange(key)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                            isActive
                                ? "bg-white/10 text-white font-medium"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                        style={isActive ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : undefined}
                    >
                        <Icon className="h-5 w-5" />
                        <span>{t(`Sections.${key}`)}</span>
                    </button>
                );
            })}
        </nav>
    );

    return (
        <div
            className={cn(
                "text-white flex",
                mode === 'live' ? "min-h-screen" : "h-full overflow-auto",
                className
            )}
            style={{ backgroundColor: bgColor }}
        >
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/50 shrink-0">
                {/* Logo/Project */}
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                        >
                            {getInitials(portalName)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-semibold truncate">{portalName}</h1>
                            <p className="text-xs text-zinc-500 truncate">{t('Sidebar.subtitle')}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1">
                    {renderSidebar()}
                </div>

                {/* User */}
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium">
                            {getInitials(client.contact_full_name)}
                        </div>
                        <span className="text-sm text-zinc-400 truncate">{client.contact_full_name}</span>
                    </div>
                </div>
            </aside>

            {/* Mobile Header + Content */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                        >
                            {getInitials(project.name)}
                        </div>
                        <span className="font-semibold">{project.name}</span>
                    </div>

                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 bg-zinc-900 border-zinc-800 p-0">
                            <div className="p-6 border-b border-zinc-800">
                                <h2 className="font-semibold text-white">{t('Sidebar.menu')}</h2>
                            </div>
                            {renderSidebar(true)}
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto">
                    <PortalContent
                        section={currentSection}
                        project={project}
                        settings={settings}
                        data={data}
                        primaryColor={primaryColor}
                        isMobile={forceMobile}
                        portalName={portalName}
                        welcomeMessage={welcomeMessage}
                    />
                </main>

                {/* Footer */}
                {showFooter && (
                    <footer className="py-4 border-t border-zinc-800 text-center">
                        {branding?.footer_text && (
                            <p className="text-xs text-zinc-400 mb-1">{branding.footer_text}</p>
                        )}
                        {showPoweredBy && (
                            <p className="text-xs text-zinc-600">
                                {t('Sidebar.poweredBy')} <span style={{ color: primaryColor }}>SEENCEL</span>
                            </p>
                        )}
                    </footer>
                )}
            </div>
        </div>
    );
}

// Content renderer for each section
interface PortalContentProps {
    section: Section;
    project: PortalProject;
    settings: PortalSettings;
    data: PortalData;
    primaryColor: string;
    isMobile?: boolean;
    portalName: string;
    welcomeMessage: string;
}

function PortalContent({ section, project, settings, data, primaryColor, isMobile, portalName, welcomeMessage }: PortalContentProps) {
    switch (section) {
        case 'dashboard':
            return (
                <DashboardSection
                    project={project}
                    settings={settings}
                    data={data}
                    primaryColor={primaryColor}
                    isMobile={isMobile}
                    portalName={portalName}
                    welcomeMessage={welcomeMessage}
                />
            );
        case 'payments':
            return <PaymentsSection data={data} settings={settings} />;
        case 'schedule':
            return <ScheduleSection data={data} settings={settings} />;
        case 'logs':
            return <LogsSection />;
        case 'messages':
            return <MessagesSection />;
        default:
            return null;
    }
}

// Dashboard Section with Hero
function DashboardSection({ project, settings, data, primaryColor, isMobile, portalName, welcomeMessage }: {
    project: PortalProject;
    settings: PortalSettings;
    data: PortalData;
    primaryColor: string;
    isMobile?: boolean;
    portalName: string;
    welcomeMessage: string;
}) {
    const t = useTranslations('Portal.Dashboard');
    const { summary } = data;
    const currencySymbol = summary?.currency_symbol || "$";
    const totalCommitted = summary?.total_committed_amount || 0;
    const totalPaid = summary?.total_paid_amount || 0;
    const balanceDue = summary?.balance_due || 0;
    const progress = totalCommitted > 0 ? Math.round((totalPaid / totalCommitted) * 100) : 0;

    const nextSchedule = data.schedules.find(s => s.status === 'pending' || s.status === 'overdue');

    const formatAmount = (amount: number) => {
        if (!settings.show_amounts) return "•••••";
        return `${currencySymbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div>
            {/* Hero */}
            <div
                className="relative h-48 md:h-64 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden"
                style={{
                    backgroundImage: project.image_url ? `url(${project.image_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 className={cn(
                        "font-bold text-white",
                        isMobile ? "text-2xl" : "text-2xl md:text-3xl"
                    )}>{portalName}</h1>
                    <p className="text-zinc-400 mt-1">{welcomeMessage}</p>
                </div>
            </div>

            {/* KPIs */}
            <div className={cn(
                "p-6 grid gap-4",
                isMobile ? "grid-cols-1" : "grid md:grid-cols-3"
            )}>
                {settings.show_progress && (
                    <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-zinc-400 text-sm">{t('progress')}</span>
                            <span className="text-2xl font-bold" style={{ color: primaryColor }}>{progress}%</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${progress}%`, backgroundColor: primaryColor }}
                            />
                        </div>
                    </div>
                )}

                {nextSchedule && (
                    <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                        <span className="text-zinc-400 text-sm block mb-2">{t('nextPayment')}</span>
                        <div className="text-2xl font-bold text-white">{formatAmount(nextSchedule.amount || 0)}</div>
                        <div className="text-xs text-zinc-500 mt-1">{nextSchedule.due_date}</div>
                    </div>
                )}

                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                    <span className="text-zinc-400 text-sm block mb-2">{t('balanceDue')}</span>
                    <div className="text-2xl font-bold text-white">{formatAmount(balanceDue)}</div>
                </div>
            </div>
        </div>
    );
}

// Payments Section
function PaymentsSection({ data, settings }: { data: PortalData; settings: PortalSettings }) {
    const t = useTranslations('Portal.Payments');
    const currencySymbol = data.summary?.currency_symbol || "$";

    const formatAmount = (amount: number) => {
        if (!settings.show_amounts) return "•••••";
        return `${currencySymbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    };

    if (data.payments.length === 0) {
        return (
            <div className="p-6 text-center py-16">
                <CreditCard className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">{t('empty')}</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-3">
            <h2 className="text-xl font-semibold mb-4">{t('title')}</h2>
            {data.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <div className="font-medium">{formatAmount(payment.amount)}</div>
                            <div className="text-xs text-zinc-500">{payment.payment_date}</div>
                        </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {t('confirmed')}
                    </span>
                </div>
            ))}
        </div>
    );
}

// Schedule Section
function ScheduleSection({ data, settings }: { data: PortalData; settings: PortalSettings }) {
    const t = useTranslations('Portal.Schedule');
    const currencySymbol = data.summary?.currency_symbol || "$";

    const formatAmount = (amount: number) => {
        if (!settings.show_amounts) return "•••••";
        return `${currencySymbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    };

    if (data.schedules.length === 0) {
        return (
            <div className="p-6 text-center py-16">
                <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">{t('empty')}</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-3">
            <h2 className="text-xl font-semibold mb-4">{t('title')}</h2>
            {data.schedules.map((schedule) => {
                const isPaid = schedule.status === 'paid';
                const isOverdue = schedule.status === 'overdue';

                return (
                    <div key={schedule.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                isPaid && "bg-emerald-500/20",
                                isOverdue && "bg-red-500/20",
                                !isPaid && !isOverdue && "bg-amber-500/20"
                            )}>
                                <Calendar className={cn(
                                    "h-5 w-5",
                                    isPaid && "text-emerald-400",
                                    isOverdue && "text-red-400",
                                    !isPaid && !isOverdue && "text-amber-400"
                                )} />
                            </div>
                            <div>
                                <div className={cn("font-medium", isPaid && "text-zinc-500 line-through")}>
                                    {formatAmount(schedule.amount || 0)}
                                </div>
                                <div className="text-xs text-zinc-500">{schedule.due_date}</div>
                            </div>
                        </div>
                        <span className={cn(
                            "px-3 py-1 rounded-full text-xs border",
                            isPaid && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            isOverdue && "bg-red-500/10 text-red-400 border-red-500/20",
                            !isPaid && !isOverdue && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                            {isPaid ? t('paid') : isOverdue ? t('overdue') : t('pending')}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// Placeholder sections
function LogsSection() {
    const t = useTranslations('Portal.Logs');
    return (
        <div className="p-6 text-center py-16">
            <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">{t('empty')}</p>
        </div>
    );
}

function MessagesSection() {
    const t = useTranslations('Portal.Messages');
    return (
        <div className="p-6 text-center py-16">
            <MessageSquare className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">{t('empty')}</p>
        </div>
    );
}

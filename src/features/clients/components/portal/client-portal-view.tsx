"use client";

import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CreditCard,
    Calendar,
    FileText,
    MessageSquare,
    TrendingUp,
    CheckCircle,
    Clock,
    AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface QuoteForPortal {
    id: string;
    name: string;
    status: string;
    total_with_tax: number;
    created_at: string;
    currency_symbol?: string;
}

interface ClientPortalViewProps {
    project: {
        id: string;
        name: string;
        organization_id: string;
        image_url?: string | null;
        color?: string | null;
    };
    client: {
        id: string;
        contact_full_name?: string | null;
        contact_avatar_url?: string | null;
    };
    settings: {
        show_dashboard: boolean;
        show_installments: boolean;
        show_payments: boolean;
        show_logs: boolean;
        show_amounts: boolean;
        show_progress: boolean;
        show_quotes: boolean;
        allow_comments: boolean;
    };
    payments: any[];
    schedules: any[];
    quotes?: QuoteForPortal[];
    summary: {
        total_committed_amount?: number;
        total_paid_amount?: number;
        balance_due?: number;
        currency_symbol?: string;
    } | null;
}

function getInitials(name: string | null | undefined) {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function ClientPortalView({
    project,
    client,
    settings,
    payments,
    schedules,
    quotes = [],
    summary
}: ClientPortalViewProps) {
    const primaryColor = project.color || "#83cc16";
    const currencySymbol = summary?.currency_symbol || "$";

    // Calculate progress
    const totalCommitted = summary?.total_committed_amount || 0;
    const totalPaid = summary?.total_paid_amount || 0;
    const balanceDue = summary?.balance_due || 0;
    const progress = totalCommitted > 0 ? Math.round((totalPaid / totalCommitted) * 100) : 0;

    // Find next schedule
    const nextSchedule = schedules.find(s => s.status === 'pending' || s.status === 'overdue');

    const formatAmount = (amount: number) => {
        if (!settings.show_amounts) return "•••••";
        return `${currencySymbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "dd MMM yyyy", { locale: es });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Header */}
            <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                        >
                            {getInitials(project.name)}
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">{project.name}</h1>
                            <p className="text-zinc-400 text-sm">Portal de Cliente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">{client.contact_full_name}</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* Dashboard Section */}
                {settings.show_dashboard && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Resumen</span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {settings.show_progress && (
                                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-zinc-400 text-sm">Progreso</span>
                                        <TrendingUp className="h-4 w-4" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="text-3xl font-bold mb-3">{progress}%</div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            )}

                            {nextSchedule && (
                                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-zinc-400 text-sm">Próximo Pago</span>
                                        <Calendar className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div className="text-2xl font-bold">{formatAmount(nextSchedule.amount || 0)}</div>
                                    <div className="text-xs text-zinc-500 mt-1">{formatDate(nextSchedule.due_date)}</div>
                                </div>
                            )}

                            <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-zinc-400 text-sm">Saldo Pendiente</span>
                                    <CreditCard className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="text-2xl font-bold">{formatAmount(balanceDue)}</div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Payments Section */}
                {settings.show_payments && payments.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Pagos Realizados</span>
                        </div>

                        <div className="space-y-2">
                            {payments.map((payment) => (
                                <div key={payment.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        <div>
                                            <div className="font-medium">{formatAmount(payment.amount)}</div>
                                            <div className="text-xs text-zinc-500">{formatDate(payment.payment_date)}</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                        {payment.status === 'confirmed' ? 'Confirmado' : payment.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Installments Section */}
                {settings.show_installments && schedules.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Cronograma de Pagos</span>
                        </div>

                        <div className="space-y-2">
                            {schedules.map((schedule) => {
                                const isPaid = schedule.status === 'paid';
                                const isPending = schedule.status === 'pending';
                                const isOverdue = schedule.status === 'overdue';

                                return (
                                    <div key={schedule.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {isPaid && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                                            {isPending && <Clock className="h-5 w-5 text-amber-500" />}
                                            {isOverdue && <AlertCircle className="h-5 w-5 text-red-500" />}
                                            {!isPaid && !isPending && !isOverdue && <Clock className="h-5 w-5 text-zinc-500" />}
                                            <div>
                                                <div className="font-medium">{schedule.notes || `Cuota`}</div>
                                                <div className="text-xs text-zinc-500">{formatDate(schedule.due_date)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn(
                                                "font-medium",
                                                isPaid ? "text-zinc-500 line-through" : "text-white"
                                            )}>
                                                {formatAmount(schedule.amount || 0)}
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "text-xs",
                                                isPaid && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                                isPending && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                isOverdue && "bg-red-500/10 text-red-400 border-red-500/20",
                                                !isPaid && !isPending && !isOverdue && "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                            )}>
                                                {isPaid && 'Pagado'}
                                                {isPending && 'Pendiente'}
                                                {isOverdue && 'Vencido'}
                                                {!isPaid && !isPending && !isOverdue && 'Próximo'}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Quotes Section */}
                {settings.show_quotes && quotes.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <FileText className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Presupuestos</span>
                        </div>

                        <div className="space-y-2">
                            {quotes.map((quote) => {
                                const statusColors: Record<string, string> = {
                                    draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                                    sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
                                };
                                const statusLabels: Record<string, string> = {
                                    draft: "Borrador",
                                    sent: "Enviado",
                                    approved: "Aprobado",
                                    rejected: "Rechazado",
                                };

                                return (
                                    <div key={quote.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-primary" />
                                            <div>
                                                <div className="font-medium">{quote.name}</div>
                                                <div className="text-xs text-zinc-500">{formatDate(quote.created_at)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <div className="font-mono font-medium">
                                                {formatAmount(quote.total_with_tax)}
                                            </div>
                                            <Badge variant="outline" className={statusColors[quote.status] || statusColors.draft}>
                                                {statusLabels[quote.status] || quote.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Logs Section (placeholder) */}
                {settings.show_logs && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <FileText className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Bitácora</span>
                        </div>

                        <div className="bg-zinc-800/30 rounded-xl p-8 border border-dashed border-zinc-700 text-center">
                            <p className="text-zinc-500">No hay actualizaciones en la bitácora.</p>
                        </div>
                    </section>
                )}

                {/* Comments Section (placeholder) */}
                {settings.allow_comments && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Mensajes</span>
                        </div>

                        <div className="bg-zinc-800/30 rounded-xl p-8 border border-dashed border-zinc-700 text-center">
                            <p className="text-zinc-500">Los comentarios estarán disponibles próximamente.</p>
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {!settings.show_dashboard && !settings.show_payments && !settings.show_installments && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 mx-auto">
                            <LayoutDashboard className="h-8 w-8 text-zinc-600" />
                        </div>
                        <h3 className="font-medium text-lg mb-2">Portal en configuración</h3>
                        <p className="text-zinc-500">El portal está siendo configurado por el equipo.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800 py-6 mt-12">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <p className="text-xs text-zinc-500">
                        Portal de clientes powered by <span style={{ color: primaryColor }}>SEENCEL</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}


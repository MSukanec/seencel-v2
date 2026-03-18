"use client";

import { Users, UserCheck, UserX, AlertTriangle, ArrowRight } from "lucide-react";
import { MetricCard } from "@/components/cards/presets/metric-card";
import { ContentCard } from "@/components/cards/presets/chart-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { CoursesDashboardData, AdminCourseEnrollment } from "@/features/admin/academy-queries";

/**
 * Admin Academy Dashboard View — "Visión General"
 * 4 KPI MetricCards + 2 ContentCards (recent enrollments + expiring enrollments)
 */
export function AdminAcademyDashboardView({ data }: { data: CoursesDashboardData }) {
    const { kpis, recentEnrollments, expiringEnrollments } = data;

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Inscripciones"
                    value={kpis.totalEnrollments}
                    icon={<Users className="h-5 w-5" />}
                    size="default"
                />
                <MetricCard
                    title="Total Activos"
                    value={kpis.activeEnrollments}
                    icon={<UserCheck className="h-5 w-5" />}
                    iconClassName="bg-semantic-positive/10 text-semantic-positive"
                    size="default"
                />
                <MetricCard
                    title="Total Vencidos"
                    value={kpis.expiredEnrollments}
                    icon={<UserX className="h-5 w-5" />}
                    iconClassName="bg-semantic-negative/10 text-semantic-negative"
                    size="default"
                />
                <MetricCard
                    title="Por Vencer (7 días)"
                    value={kpis.expiringIn7Days}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    iconClassName="bg-semantic-warning/10 text-semantic-warning"
                    size="default"
                />
            </div>

            {/* Content Cards Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Enrollments */}
                <ContentCard
                    title="Últimas Inscripciones"
                    description="Las 10 inscripciones más recientes"
                    icon={<Users className="h-4 w-4" />}
                    headerAction={
                        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                            <Link href="/admin/academy/students">
                                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    }
                >
                    <div className="space-y-1">
                        {recentEnrollments.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Sin inscripciones aún</p>
                        ) : (
                            recentEnrollments.map((enrollment) => (
                                <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                            ))
                        )}
                    </div>
                </ContentCard>

                {/* Expiring Enrollments */}
                <ContentCard
                    title="Próximos Vencimientos"
                    description="Vencen en los próximos 7 días"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    headerAction={
                        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                            <Link href="/admin/academy/students">
                                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    }
                >
                    <div className="space-y-1">
                        {expiringEnrollments.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Sin vencimientos próximos</p>
                        ) : (
                            expiringEnrollments.map((enrollment) => (
                                <EnrollmentRow key={enrollment.id} enrollment={enrollment} showExpiry />
                            ))
                        )}
                    </div>
                </ContentCard>
            </div>
        </div>
    );
}

// ─── Enrollment Row ─────────────────────────────────────────────────────────

function EnrollmentRow({ enrollment, showExpiry }: { enrollment: AdminCourseEnrollment; showExpiry?: boolean }) {
    const userName = enrollment.user?.full_name || enrollment.user?.email || "Usuario";
    const initials = userName.slice(0, 2).toUpperCase();
    const courseTitle = enrollment.course?.title || "Curso";

    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        active: { label: "Activo", variant: "default" },
        completed: { label: "Completado", variant: "secondary" },
        expired: { label: "Vencido", variant: "destructive" },
    };
    const statusInfo = statusMap[enrollment.status] || { label: enrollment.status, variant: "outline" as const };

    const expiryDate = enrollment.expires_at
        ? new Date(enrollment.expires_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
        : null;

    return (
        <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={enrollment.user?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{courseTitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {showExpiry && expiryDate && (
                    <span className="text-xs text-semantic-warning font-medium">{expiryDate}</span>
                )}
                <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">
                    {statusInfo.label}
                </Badge>
            </div>
        </div>
    );
}

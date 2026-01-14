"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    Users,
    DollarSign,
    TrendingUp,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    GraduationCap,
} from "lucide-react";
import type { CoursesDashboardData, AdminCourseEnrollment } from "@/features/admin/academy-queries";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CoursesDashboardProps {
    data: CoursesDashboardData;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function getStatusBadge(status: string) {
    switch (status) {
        case "active":
            return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>;
        case "completed":
            return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Completado</Badge>;
        case "expired":
            return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Expirado</Badge>;
        case "cancelled":
            return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Cancelado</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

function EnrollmentRow({ enrollment }: { enrollment: AdminCourseEnrollment }) {
    const initials = enrollment.user?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || enrollment.user?.email?.[0]?.toUpperCase() || "?";

    return (
        <div className="flex items-center gap-4 py-3 border-b last:border-0">
            <Avatar className="h-9 w-9">
                <AvatarImage src={enrollment.user?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                    {enrollment.user?.full_name || enrollment.user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {enrollment.course?.title}
                </p>
            </div>
            <div className="text-right">
                {getStatusBadge(enrollment.status)}
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(enrollment.created_at), { addSuffix: true, locale: es })}
                </p>
            </div>
        </div>
    );
}

export function CoursesDashboard({ data }: CoursesDashboardProps) {
    const { kpis, recentEnrollments, expiringEnrollments, courseStats } = data;

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalEnrollments}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-500">{kpis.activeEnrollments} activos</span>
                            {" · "}
                            <span className="text-blue-500">{kpis.completedEnrollments} completados</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-500">+{formatCurrency(kpis.revenueThisMonth)}</span> este mes
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.avgProgress.toFixed(1)}%</div>
                        <Progress value={kpis.avgProgress} className="h-2 mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vencimientos</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {kpis.expiringIn7Days > 0 ? (
                                <>
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    <span className="text-amber-500">{kpis.expiringIn7Days}</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span>0</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            próximos 7 días · <span className="text-red-500">{kpis.expiredEnrollments} expirados</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Enrollments & Expiring */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Inscripciones Recientes
                        </CardTitle>
                        <CardDescription>Últimas 10 inscripciones</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentEnrollments.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No hay inscripciones aún
                            </p>
                        ) : (
                            <div className="space-y-0">
                                {recentEnrollments.map((enrollment) => (
                                    <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Próximos Vencimientos
                        </CardTitle>
                        <CardDescription>Inscripciones que vencen en 7 días</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expiringEnrollments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    No hay vencimientos próximos
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {expiringEnrollments.map((enrollment) => (
                                    <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Course Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Estadísticas por Curso</CardTitle>
                    <CardDescription>Inscripciones, ingresos y progreso promedio</CardDescription>
                </CardHeader>
                <CardContent>
                    {courseStats.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            No hay cursos aún
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {courseStats.map((course) => (
                                <div key={course.course_id} className="flex items-center gap-4 py-2 border-b last:border-0">
                                    <div className="flex-1">
                                        <p className="font-medium">{course.course_title}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {course.enrollments} alumnos
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" />
                                                {formatCurrency(course.revenue)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-32">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Progreso</span>
                                            <span className="font-medium">{course.avg_progress.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={course.avg_progress} className="h-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

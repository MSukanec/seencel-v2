"use client";

import { Building, FolderOpen, DollarSign, Clock } from "lucide-react";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

// ============================================
// CLIENT OVERVIEW VIEW (External Actor)
// ============================================
// Vista principal del portal de clientes.
// Muestra un resumen de los proyectos y actividad reciente del cliente.
// Por ahora usa datos mock hasta que se conecte con queries reales.
// ============================================

interface ClientOverviewViewProps {
    // Future: real data props
    organizationName?: string;
}

export function ClientOverviewView({ organizationName = "Organización" }: ClientOverviewViewProps) {
    // Mock data
    const mockKpis = {
        activeProjects: 2,
        pendingDocuments: 3,
        nextPaymentAmount: "$ 450.000",
        nextPaymentDate: "15 Mar 2026",
    };

    return (
        <div className="p-6 space-y-6 overflow-auto h-full">
            {/* Welcome Section */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                    Bienvenido al Portal de {organizationName}
                </h2>
                <p className="text-muted-foreground">
                    Aquí podés ver el estado de tus proyectos, documentos y pagos.
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardKpiCard
                    title="Proyectos Activos"
                    value={mockKpis.activeProjects}
                    icon={<Building className="h-5 w-5" />}
                    description="En los que participás"
                    size="large"
                />
                <DashboardKpiCard
                    title="Documentos Pendientes"
                    value={mockKpis.pendingDocuments}
                    icon={<FolderOpen className="h-5 w-5" />}
                    description="Por revisar o firmar"
                    size="large"
                />
                <DashboardKpiCard
                    title="Próximo Pago"
                    value={mockKpis.nextPaymentAmount}
                    icon={<DollarSign className="h-5 w-5" />}
                    description={`Vence el ${mockKpis.nextPaymentDate}`}
                    size="large"
                />
                <DashboardKpiCard
                    title="Última Actividad"
                    value="Hace 2 días"
                    icon={<Clock className="h-5 w-5" />}
                    description="Actualización de planos"
                    size="large"
                />
            </div>

            {/* Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DashboardCard
                    title="Actividad Reciente"
                    description="Últimas novedades de tus proyectos"
                    icon={<Clock className="h-4 w-4" />}
                >
                    <div className="space-y-3 py-2">
                        {[
                            { text: "Se subieron nuevos planos al proyecto Edificio Norte", time: "Hace 2 días" },
                            { text: "Certificación #3 aprobada en Torre Central", time: "Hace 5 días" },
                            { text: "Nuevo presupuesto disponible para revisión", time: "Hace 1 semana" },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm">
                                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground">{item.text}</p>
                                    <p className="text-xs text-muted-foreground">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                <DashboardCard
                    title="Tus Proyectos"
                    description="Proyectos en los que participás como cliente"
                    icon={<Building className="h-4 w-4" />}
                >
                    <div className="space-y-3 py-2">
                        {[
                            { name: "Edificio Norte", status: "En construcción", progress: "65%" },
                            { name: "Torre Central", status: "En planificación", progress: "15%" },
                        ].map((project, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                    <p className="font-medium text-sm">{project.name}</p>
                                    <p className="text-xs text-muted-foreground">{project.status}</p>
                                </div>
                                <div className="text-sm font-mono font-medium text-primary">
                                    {project.progress}
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
}

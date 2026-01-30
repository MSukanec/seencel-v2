"use client";

import { useState, useMemo } from "react";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useModal } from "@/providers/modal-store";
import {
    Plus,
    Users,
    UserCheck,
    UserX,
    Phone,
    Mail,
    Calendar,
    Paperclip,
    Receipt,
    Pencil
} from "lucide-react";
import { ProjectLaborView, LaborType, LABOR_STATUS_LABELS } from "../types";
import { LaborWorkerForm } from "../forms/labor-worker-form";
import { useMoney } from "@/hooks/use-money";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ContactOption {
    id: string;
    name: string;
    image?: string | null;
    fallback?: string;
}

interface LaborTeamViewProps {
    projectId: string;
    orgId: string;
    workers: ProjectLaborView[];
    laborTypes: LaborType[];
    contacts: ContactOption[];
}

export function LaborTeamView({
    projectId,
    orgId,
    workers,
    laborTypes,
    contacts,
}: LaborTeamViewProps) {
    const money = useMoney();
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");

    // Filter workers by search
    const filteredWorkers = useMemo(() => {
        if (!searchQuery) return workers;
        const query = searchQuery.toLowerCase();
        return workers.filter(w => {
            return (
                w.contact_display_name?.toLowerCase().includes(query) ||
                w.contact_first_name?.toLowerCase().includes(query) ||
                w.contact_last_name?.toLowerCase().includes(query) ||
                w.labor_type_name?.toLowerCase().includes(query) ||
                w.contact_phone?.toLowerCase().includes(query) ||
                w.contact_email?.toLowerCase().includes(query) ||
                w.notes?.toLowerCase().includes(query)
            );
        });
    }, [workers, searchQuery]);

    // Calculate KPIs
    const kpiData = useMemo(() => {
        const active = filteredWorkers.filter(w => w.status === "active");
        const inactive = filteredWorkers.filter(w => w.status === "inactive");
        const absent = filteredWorkers.filter(w => w.status === "absent");

        return {
            total: filteredWorkers.length,
            active: active.length,
            inactive: inactive.length,
            absent: absent.length,
        };
    }, [filteredWorkers]);

    const handleOpenForm = (worker?: ProjectLaborView) => {
        openModal(
            <LaborWorkerForm
                initialData={worker}
                contacts={contacts}
                laborTypes={laborTypes}
                projectId={projectId}
                organizationId={orgId}
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: worker ? "Editar Trabajador" : "Agregar Trabajador",
                description: worker
                    ? "Modificá los datos del trabajador asignado al proyecto."
                    : "Seleccioná un contacto para agregarlo al equipo del proyecto.",
                size: "md",
            }
        );
    };

    const toolbarActions = [
        {
            label: "Agregar Trabajador",
            icon: Plus,
            onClick: () => handleOpenForm(),
        },
    ];

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        try {
            return format(new Date(dateStr), "dd MMM yyyy", { locale: es });
        } catch {
            return "—";
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
            absent: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
            inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        };
        return colors[status as keyof typeof colors] || colors.inactive;
    };

    const getInitials = (worker: ProjectLaborView) => {
        if (worker.contact_first_name && worker.contact_last_name) {
            return `${worker.contact_first_name[0]}${worker.contact_last_name[0]}`.toUpperCase();
        }
        if (worker.contact_display_name) {
            const parts = worker.contact_display_name.split(" ");
            return parts.length > 1
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : parts[0].slice(0, 2).toUpperCase();
        }
        return "TR";
    };

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar trabajadores..."
                actions={toolbarActions}
            />

            <ContentLayout variant="wide" className="pb-6">
                {workers.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="Sin Trabajadores Registrados"
                        description="Agregá trabajadores para gestionar la mano de obra del proyecto."
                    />
                ) : (
                    <div className="space-y-6">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <DashboardKpiCard
                                title="Total Trabajadores"
                                value={kpiData.total.toString()}
                                icon={<Users className="h-5 w-5" />}
                                iconClassName="bg-primary/10 text-primary"
                            />
                            <DashboardKpiCard
                                title="Activos"
                                value={kpiData.active.toString()}
                                icon={<UserCheck className="h-5 w-5" />}
                                iconClassName="bg-emerald-500/10 text-emerald-600"
                            />
                            <DashboardKpiCard
                                title="Ausentes"
                                value={kpiData.absent.toString()}
                                icon={<UserX className="h-5 w-5" />}
                                iconClassName="bg-amber-500/10 text-amber-600"
                            />
                            <DashboardKpiCard
                                title="Inactivos"
                                value={kpiData.inactive.toString()}
                                icon={<UserX className="h-5 w-5" />}
                                iconClassName="bg-gray-500/10 text-gray-600"
                            />
                        </div>

                        {/* Workers Cards - Single Column */}
                        <div className="flex flex-col gap-3">
                            {filteredWorkers.map((worker) => (
                                <Card
                                    key={worker.id}
                                    className="group hover:shadow-md transition-all duration-200 hover:border-primary/30"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Left: Worker Info */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {/* Avatar */}
                                                <Avatar className="h-12 w-12 shrink-0">
                                                    <AvatarImage
                                                        src={worker.contact_image_url || undefined}
                                                        alt={worker.contact_display_name || "Trabajador"}
                                                    />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                        {getInitials(worker)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                {/* Worker Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                                            {worker.contact_display_name || `Trabajador #${worker.id.slice(0, 8)}`}
                                                        </h3>
                                                        <Badge
                                                            variant="secondary"
                                                            className={getStatusBadge(worker.status)}
                                                        >
                                                            {LABOR_STATUS_LABELS[worker.status]}
                                                        </Badge>
                                                        {worker.contact_has_attachments && (
                                                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                                                        {worker.labor_type_name && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {worker.labor_type_name}
                                                            </Badge>
                                                        )}
                                                        {worker.contact_phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {worker.contact_phone}
                                                            </span>
                                                        )}
                                                        {worker.contact_email && (
                                                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                                                                <Mail className="h-3 w-3" />
                                                                {worker.contact_email}
                                                            </span>
                                                        )}
                                                        {worker.start_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                Desde {formatDate(worker.start_date)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Stats + Edit Button */}
                                            <div className="flex items-center gap-4 text-right shrink-0">
                                                {worker.total_payments_count > 0 && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Receipt className="h-3 w-3" />
                                                            {worker.total_payments_count} pagos
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {money.format(worker.total_amount_paid)}
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleOpenForm(worker)}
                                                    className="p-2 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Editar trabajador"
                                                >
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </ContentLayout>
        </>
    );
}

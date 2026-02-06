"use client";

import { useMemo } from "react";
import { Calendar, Plus } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ClientSchedulesTable } from "../components/tables/client-schedules-table";

export interface ClientSchedule {
    id: string;
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    currency?: {
        symbol: string;
        code: string;
    };
    commitment?: {
        client?: {
            contact?: {
                full_name: string;
            };
        };
    };
}

interface ClientsSchedulesViewProps {
    data: ClientSchedule[];
}

export function ClientsSchedulesView({ data }: ClientsSchedulesViewProps) {
    // Stats for potential toolbar or header
    const stats = useMemo(() => {
        const pending = data.filter(s => s.status === 'pending').length;
        const overdue = data.filter(s => s.status === 'overdue').length;
        const paid = data.filter(s => s.status === 'paid').length;
        return { pending, overdue, paid, total: data.length };
    }, [data]);

    // ✅ CORRECTO: EmptyState SIN action duplicada (ya está en Toolbar si aplica)
    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <ViewEmptyState
                    mode="empty"
                    icon={Calendar}
                    viewName="Cronogramas de Cuotas"
                    featureDescription="Visualiza y gestiona los vencimientos de cuotas de tus clientes."
                    comingSoon
                />
            </div>
        );
    }

    // ✅ CORRECTO: Renderizar tabla con datos
    return (
        <>
            {/* Toolbar solo si hay acciones relevantes - por ahora vacío */}
            <ClientSchedulesTable data={data} />
        </>
    );
}

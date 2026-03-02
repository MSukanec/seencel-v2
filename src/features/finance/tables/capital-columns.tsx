"use client";

/**
 * Capital (Socios) Table Columns
 * Standard 19.0 - Composable DataTable Columns
 * 
 * Column definitions for the Capital/Socios tables:
 * - Participant summary table
 * - Capital movement ledger table
 * 
 * ALL columns use Column Factories.
 */

import { ColumnDef } from "@tanstack/react-table";
import {
    createDateColumn,
    createTextColumn,
    createMoneyColumn,
    createStatusColumn,
    createPercentColumn,
    createEntityColumn,
} from "@/components/shared/data-table/columns";
import type { StatusOption } from "@/components/shared/data-table/columns";

// ─── Constants ───────────────────────────────────────────

export const CAPITAL_TYPE_LABELS: Record<string, string> = {
    contribution: "Aporte",
    withdrawal: "Retiro",
    adjustment: "Ajuste",
};

export const CAPITAL_TYPE_OPTIONS = Object.entries(CAPITAL_TYPE_LABELS).map(
    ([value, label]) => ({ label, value })
);

export const PARTICIPANT_STATUS_CONFIG: StatusOption[] = [
    { value: "active", label: "Activo", variant: "positive" },
    { value: "inactive", label: "Inactivo", variant: "neutral" },
];

export const CAPITAL_MOVEMENT_STATUS_CONFIG: StatusOption[] = [
    { value: "confirmed", label: "Confirmado", variant: "positive" },
    { value: "pending", label: "Pendiente", variant: "warning" },
    { value: "rejected", label: "Rechazado", variant: "negative" },
];

// ─── Participant Columns ─────────────────────────────────

export function getParticipantColumns(): ColumnDef<any>[] {
    return [
        // 1. Nombre con avatar
        createEntityColumn<any>({
            accessorKey: "name",
            title: "Participante",
            showAvatar: true,
            getAvatarUrl: (row) => row.avatar_url,
            getAvatarFallback: (row) => row.name,
        }),
        // 2. % Esperado
        createPercentColumn<any>({
            accessorKey: "ownership_percentage",
            title: "% Esperado",
        }),
        // 3. Aportes
        createMoneyColumn<any>({
            accessorKey: "total_contributed",
            title: "Aportes",
        }),
        // 4. Retiros
        createMoneyColumn<any>({
            accessorKey: "total_withdrawn",
            title: "Retiros",
        }),
        // 5. Balance — coloreado
        createMoneyColumn<any>({
            accessorKey: "current_balance",
            title: "Balance",
            colorMode: "auto",
        }),
        // 6. Estado
        createStatusColumn<any>({
            options: PARTICIPANT_STATUS_CONFIG,
        }),
    ];
}

// ─── Capital Movement Columns ────────────────────────────

interface CapitalMovementColumnsOptions {
    /** Participant list for avatar lookup */
    participants: { id: string; name: string; avatar_url?: string }[];
    /** Wallet lookup function */
    getWalletName: (walletId: string) => string;
    /** Generic inline update handler (row, partialFields) */
    onInlineUpdate?: (row: any, fields: Record<string, any>) => void;
}

export function getCapitalMovementColumns(
    options: CapitalMovementColumnsOptions
): ColumnDef<any>[] {
    const { participants, getWalletName, onInlineUpdate } = options;

    return [
        // 1. Fecha con avatar del creador + inline editing
        createDateColumn<any>({
            accessorKey: "payment_date",
            avatarFallbackKey: "creator_name",
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newDate) => onInlineUpdate(row, { movement_date: newDate })
                : undefined,
        }),
        // 2. Tipo con avatar del participante
        createEntityColumn<any>({
            accessorKey: "type",
            title: "Tipo",
            labels: CAPITAL_TYPE_LABELS,
            showAvatar: true,
            getSubtitle: (row) => {
                const p = participants.find(pp => pp.id === row.participant_id);
                return p?.name || "Participante";
            },
            getAvatarUrl: (row) => {
                const p = participants.find(pp => pp.id === row.participant_id);
                return p?.avatar_url;
            },
            getAvatarFallback: (row) => {
                const p = participants.find(pp => pp.id === row.participant_id);
                return p?.name;
            },
            size: 140,
        }),
        // 3. Descripción — truncado + inline editing
        createTextColumn<any>({
            accessorKey: "description",
            title: "Descripción",
            truncate: true,
            secondary: true,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { notes: newValue })
                : undefined,
            editPlaceholder: "Agregar descripción...",
        }),
        // 4. Billetera — lookup
        createTextColumn<any>({
            accessorKey: "wallet_id",
            title: "Billetera",
            size: 110,
            customRender: (_value, row) => (
                <span className="text-sm text-foreground/80">{getWalletName((row as any).wallet_id)}</span>
            ),
        }),
        // 5. Monto — auto prefix/color
        createMoneyColumn<any>({
            accessorKey: "amount",
            prefix: "auto",
            colorMode: "auto",
            signKey: "type",
            signPositiveValue: "contribution",
            currencyKey: "currency_code",
        }),
        // 6. Estado — inline editing con Popover
        createStatusColumn<any>({
            options: CAPITAL_MOVEMENT_STATUS_CONFIG,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { status: newValue })
                : undefined,
        }),
    ];
}

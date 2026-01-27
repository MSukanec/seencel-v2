"use server";

/**
 * Server actions for fetching report data
 * 
 * These actions are called by report blocks to get real data from the database.
 */

import { createClient } from "@/lib/supabase/server";
import { getDataTable, getVisibleColumns, type ColumnDefinition } from "./data-source-registry";

// ============================================================================
// Types
// ============================================================================

export interface FetchReportDataResult {
    data: Record<string, any>[];
    columns: ColumnDefinition[];
    error?: string;
}

export interface FetchReportDataParams {
    sourceId: string;
    tableId: string;
    projectId: string;
    filters?: Record<string, any>;
}

// ============================================================================
// Main Fetcher
// ============================================================================

export async function fetchReportData(
    params: FetchReportDataParams
): Promise<FetchReportDataResult> {
    const { sourceId, tableId, projectId, filters = {} } = params;

    // Validate table exists in registry
    const table = getDataTable(sourceId, tableId);
    if (!table) {
        return { data: [], columns: [], error: "Data source not found" };
    }

    // Determine if we're showing multiple entities (affects column visibility)
    const isMultiple = !filters.subcontractId || filters.subcontractId === "all";
    const columns = getVisibleColumns(sourceId, tableId, isMultiple);

    try {
        // Route to specific fetcher based on source/table
        let data: Record<string, any>[] = [];

        if (sourceId === "subcontracts" && tableId === "payments") {
            data = await fetchSubcontractPayments(projectId, filters);
        }
        // Future: add more fetchers here

        return { data, columns };
    } catch (error) {
        console.error("Error fetching report data:", error);
        return { data: [], columns, error: "Error al cargar datos" };
    }
}

// ============================================================================
// Specific Fetchers
// ============================================================================

async function fetchSubcontractPayments(
    projectId: string,
    filters: Record<string, any>
): Promise<Record<string, any>[]> {
    const supabase = await createClient();

    let query = supabase
        .from("subcontract_payments")
        .select(`
            id,
            payment_date,
            amount,
            currency_id,
            subcontract:subcontracts(
                id,
                contact:contacts(
                    full_name,
                    company_name
                )
            ),
            currency:currencies(
                code,
                symbol
            ),
            organization_wallet:organization_wallets(
                wallet:wallets(
                    name
                )
            )
        `)
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        .order("payment_date", { ascending: false });

    // Apply optional subcontract filter
    if (filters.subcontractId && filters.subcontractId !== "all") {
        query = query.eq("subcontract_id", filters.subcontractId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching subcontract payments:", error);
        return [];
    }

    // Flatten data for table display
    return (data || []).map((item: any) => ({
        id: item.id,
        payment_date: item.payment_date,
        amount: item.amount,
        currency_symbol: item.currency?.symbol || "$",
        currency_code: item.currency?.code || "ARS",
        provider_name: item.subcontract?.contact?.full_name ||
            item.subcontract?.contact?.company_name ||
            "Desconocido",
        wallet_name: item.organization_wallet?.wallet?.name || "Sin billetera",
    }));
}

// ============================================================================
// Helpers for Config Panel
// ============================================================================

export async function getSubcontractsForProject(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("subcontracts")
        .select(`
            id,
            title,
            contact:contacts(
                full_name,
                company_name
            )
        `)
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        .order("title");

    if (error) {
        console.error("Error fetching subcontracts:", error);
        return [];
    }

    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.title || item.contact?.full_name || item.contact?.company_name || "Sin título",
    }));
}

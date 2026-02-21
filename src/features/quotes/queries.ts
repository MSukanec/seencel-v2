"use server";

import { createClient } from "@/lib/supabase/server";
import { QuoteView } from "./types";

/**
 * Get all quotes for an organization (from quotes_view)
 */
export async function getOrganizationQuotes(organizationId: string): Promise<QuoteView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("construction").from("quotes_view")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_deleted", false)
        // Hide Change Orders from main list (they appear inside contracts)
        .neq("quote_type", "change_order")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching quotes:", error);
        return [];
    }

    return data as QuoteView[];
}

/**
 * Get quotes for a specific project
 */
export async function getProjectQuotes(projectId: string): Promise<QuoteView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("construction").from("quotes_view")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        // Hide Change Orders from main list
        .neq("quote_type", "change_order")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching project quotes:", error);
        return [];
    }

    return data as QuoteView[];
}

/**
 * Get a single quote by ID
 */
export async function getQuote(quoteId: string): Promise<QuoteView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("construction").from("quotes_view")
        .select("*")
        .eq("id", quoteId)
        .eq("is_deleted", false)
        .single();

    if (error) {
        console.error("Error fetching quote:", error);
        return null;
    }

    return data as QuoteView;
}

/**
 * Get quote items for a quote
 */
export async function getQuoteItems(quoteId: string) {
    const supabase = await createClient();

    // Query 1: quote_items desde construction schema (sin joins cross-schema)
    const { data: items, error } = await supabase
        .schema("finance").from("quote_items")
        .select("*")
        .eq("quote_id", quoteId)
        .eq("is_deleted", false)
        .order("sort_key", { ascending: true });

    if (error) {
        console.error("Error fetching quote items:", error);
        return [];
    }

    if (!items || items.length === 0) return [];

    // Query 2: enriquecer con datos de tasks desde public schema
    const taskIds = [...new Set(items.map(i => i.task_id).filter(Boolean))];

    let tasksMap: Record<string, { name: string | null; custom_name: string | null; division_name: string | null; unit: string | null }> = {};

    if (taskIds.length > 0) {
        const { data: tasks } = await supabase
            .from("tasks")
            .select(`
                id,
                name,
                custom_name,
                task_divisions:task_division_id (name),
                units:unit_id (symbol)
            `)
            .in("id", taskIds);

        if (tasks) {
            tasksMap = Object.fromEntries(tasks.map(t => [t.id, {
                name: t.name || null,
                custom_name: t.custom_name || null,
                division_name: (t.task_divisions as unknown as { name: string } | null)?.name || null,
                unit: (t.units as unknown as { symbol: string } | null)?.symbol || null,
            }]));
        }
    }

    return items.map(item => ({
        ...item,
        task_name: tasksMap[item.task_id]?.name || null,
        custom_name: tasksMap[item.task_id]?.custom_name || null,
        division_name: tasksMap[item.task_id]?.division_name || null,
        unit: tasksMap[item.task_id]?.unit || null,
        position: item.sort_key,
        subtotal: item.quantity * item.unit_price,
        subtotal_with_markup: item.quantity * item.unit_price * (1 + (item.markup_pct || 0) / 100),
    }));

}

// ============================================
// CHANGE ORDERS QUERIES
// ============================================

/**
 * Get all change orders for a parent contract
 */
export async function getChangeOrdersByContract(contractId: string): Promise<QuoteView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("construction").from("quotes_view")
        .select("*")
        .eq("parent_quote_id", contractId)
        .eq("quote_type", "change_order")
        .eq("is_deleted", false)
        .order("change_order_number", { ascending: true });

    if (error) {
        console.error("Error fetching change orders:", error);
        return [];
    }

    return data as QuoteView[];
}

/**
 * Get contract summary with aggregated change order data
 */
export async function getContractSummary(contractId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("construction").from("contract_summary_view")
        .select("*")
        .eq("id", contractId)
        .single();

    if (error) {
        console.error("Error fetching contract summary:", error);
        return null;
    }

    return data;
}

/**
 * Get contract with its change orders (for detail view)
 */
export async function getContractWithChangeOrders(contractId: string) {
    const [contract, changeOrders, summary] = await Promise.all([
        getQuote(contractId),
        getChangeOrdersByContract(contractId),
        getContractSummary(contractId)
    ]);

    return {
        contract,
        changeOrders,
        summary
    };
}

/**
 * Get next change order number for a contract
 */
export async function getNextChangeOrderNumber(contractId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("finance").from("quotes")
        .select("change_order_number")
        .eq("parent_quote_id", contractId)
        .eq("quote_type", "change_order")
        .eq("is_deleted", false)
        .order("change_order_number", { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching next CO number:", error);
        return 1;
    }

    const maxNumber = data?.[0]?.change_order_number || 0;
    return maxNumber + 1;
}

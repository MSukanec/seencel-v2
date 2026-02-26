"use server";

import { createClient } from "@/lib/supabase/server";
import { QuoteView } from "./types";

/**
 * Get all quotes for an organization (from quotes_view)
 */
export async function getOrganizationQuotes(organizationId: string): Promise<QuoteView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("finance").from("quotes_view")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_deleted", false)
        .neq("quote_type", "change_order")
        .order("created_at", { ascending: false })
        .limit(500);

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
        .schema("finance").from("quotes_view")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        .neq("quote_type", "change_order")
        .order("created_at", { ascending: false })
        .limit(500);

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
        .schema("finance").from("quotes_view")
        .select("*")
        .eq("id", quoteId)
        .eq("is_deleted", false)
        .single();

    if (error) {
        console.error("Error fetching quote:", JSON.stringify(error, null, 2));
        return null;
    }

    return data as QuoteView;
}

/**
 * Get quote items for a quote
 */
export async function getQuoteItems(quoteId: string) {
    const supabase = await createClient();

    // Use quotes_items_view which includes:
    // - Task info (task_name, custom_name, division_name, unit)
    // - Live costs from recipe (live_mat_cost, live_lab_cost, live_ext_cost, live_unit_price)
    // - Snapshot costs (snapshot_mat_cost, snapshot_lab_cost, snapshot_ext_cost)
    // - effective_unit_price (live if draft, snapshot if sent/approved)
    const { data: items, error } = await supabase
        .schema("finance").from("quotes_items_view")
        .select("*")
        .eq("budget_id", quoteId)
        .order("position", { ascending: true })
        .limit(500);

    if (error) {
        console.error("Error fetching quote items:", error);
        return [];
    }

    return (items || []) as any[];
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
        .schema("finance").from("quotes_view")
        .select("*")
        .eq("parent_quote_id", contractId)
        .eq("quote_type", "change_order")
        .eq("is_deleted", false)
        .order("change_order_number", { ascending: true })
        .limit(100);

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
        .schema("finance").from("contract_summary_view")
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

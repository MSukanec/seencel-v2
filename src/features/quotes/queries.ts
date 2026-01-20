"use server";

import { createClient } from "@/lib/supabase/server";
import { QuoteView } from "./types";

/**
 * Get all quotes for an organization (from quotes_view)
 */
export async function getOrganizationQuotes(organizationId: string): Promise<QuoteView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("quotes_view")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_deleted", false)
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
        .from("quotes_view")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_deleted", false)
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
        .from("quotes_view")
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

    // Use table directly with joins instead of view (view may not exist yet)
    const { data, error } = await supabase
        .from("quote_items")
        .select(`
            *,
            tasks:task_id (
                name,
                custom_name,
                task_divisions:task_division_id (name),
                units:unit_id (name)
            )
        `)
        .eq("quote_id", quoteId)
        .order("sort_key", { ascending: true });

    if (error) {
        console.error("Error fetching quote items:", error);
        return [];
    }

    // Transform to match QuoteItemView interface
    return (data || []).map(item => ({
        ...item,
        task_name: item.tasks?.name || null,
        custom_name: item.tasks?.custom_name || null,
        division_name: item.tasks?.task_divisions?.name || null,
        unit: item.tasks?.units?.name || null,
        position: item.sort_key,
        subtotal: item.quantity * item.unit_price,
        subtotal_with_markup: item.quantity * item.unit_price * (1 + (item.markup_pct || 0) / 100),
    }));
}

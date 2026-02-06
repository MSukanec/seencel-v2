"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export interface CatalogUnit {
    id: string;
    name: string;
    symbol: string | null;
    applicable_to: string[];
    organization_id: string | null;
    is_system: boolean;
}

export interface CatalogUnitPresentation {
    id: string;
    unit_id: string;
    unit_name: string | null;
    unit_symbol: string | null;
    name: string;
    equivalence: number;
    organization_id: string | null;
    is_system: boolean;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get all units for an organization catalog
 * Returns both system units and organization-specific units
 */
export async function getUnitsForOrganization(organizationId: string): Promise<CatalogUnit[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('units')
        .select('id, name, symbol, applicable_to, organization_id')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching units:", error);
        return [];
    }

    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol,
        applicable_to: u.applicable_to || ['task', 'material', 'labor'],
        organization_id: u.organization_id,
        is_system: u.organization_id === null,
    }));
}

/**
 * Get all unit presentations for an organization catalog
 * Returns both system presentations and organization-specific presentations
 */
export async function getUnitPresentationsForOrganization(organizationId: string): Promise<CatalogUnitPresentation[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('unit_presentations')
        .select(`
            id,
            unit_id,
            name,
            equivalence,
            organization_id,
            units (name, symbol)
        `)
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching unit presentations:", error);
        return [];
    }

    return (data || []).map((p: any) => ({
        id: p.id,
        unit_id: p.unit_id,
        unit_name: p.units?.name || null,
        unit_symbol: p.units?.symbol || null,
        name: p.name,
        equivalence: parseFloat(p.equivalence) || 1,
        organization_id: p.organization_id,
        is_system: p.organization_id === null,
    }));
}

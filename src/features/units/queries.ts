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

// ============================================================================
// Queries
// ============================================================================

// Removed getUnitCategories()

/**
 * Get all units for an organization catalog
 * Returns both system units and organization-specific units
 */
export async function getUnitsForOrganization(organizationId: string): Promise<CatalogUnit[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('units')
        .select('id, name, symbol, applicable_to, organization_id, is_system')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false)
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
        is_system: u.is_system ?? (u.organization_id === null),
    }));
}


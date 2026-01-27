"use server";

import { createClient } from "@/lib/supabase/server";
import type { EconomicIndexType, EconomicIndexComponent, EconomicIndexValue } from "./types";

/**
 * Get all index types for an organization with their components and latest value
 */
export async function getIndexTypes(organizationId: string): Promise<EconomicIndexType[]> {
    const supabase = await createClient();

    const { data: indexTypes, error } = await supabase
        .from('economic_index_types')
        .select(`
            *,
            components:economic_index_components(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching index types:', error);
        return [];
    }

    // For each index type, get the latest value and count
    const enrichedTypes = await Promise.all(
        (indexTypes || []).map(async (indexType) => {
            const { data: values, count } = await supabase
                .from('economic_index_values')
                .select('*', { count: 'exact' })
                .eq('index_type_id', indexType.id)
                .order('period_year', { ascending: false })
                .order('period_month', { ascending: false, nullsFirst: false })
                .limit(1);

            return {
                ...indexType,
                components: (indexType.components || []).sort((a: EconomicIndexComponent, b: EconomicIndexComponent) => a.sort_order - b.sort_order),
                values_count: count || 0,
                latest_value: values?.[0] || null,
            };
        })
    );

    return enrichedTypes as EconomicIndexType[];
}

/**
 * Get a single index type with all its components
 */
export async function getIndexType(indexTypeId: string): Promise<EconomicIndexType | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_types')
        .select(`
            *,
            components:economic_index_components(*)
        `)
        .eq('id', indexTypeId)
        .single();

    if (error) {
        console.error('Error fetching index type:', error);
        return null;
    }

    return {
        ...data,
        components: (data.components || []).sort((a: EconomicIndexComponent, b: EconomicIndexComponent) => a.sort_order - b.sort_order),
    } as EconomicIndexType;
}

/**
 * Get all values for an index type, ordered by period
 */
export async function getIndexValues(indexTypeId: string): Promise<EconomicIndexValue[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_values')
        .select('*')
        .eq('index_type_id', indexTypeId)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false, nullsFirst: false })
        .order('period_quarter', { ascending: false, nullsFirst: false });

    if (error) {
        console.error('Error fetching index values:', error);
        return [];
    }

    return data as EconomicIndexValue[];
}

/**
 * Get components for an index type
 */
export async function getIndexComponents(indexTypeId: string): Promise<EconomicIndexComponent[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_components')
        .select('*')
        .eq('index_type_id', indexTypeId)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching index components:', error);
        return [];
    }

    return data as EconomicIndexComponent[];
}

/**
 * Get index value for a specific period
 */
export async function getIndexValueByPeriod(
    indexTypeId: string,
    year: number,
    month: number
): Promise<EconomicIndexValue | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_values')
        .select('*')
        .eq('index_type_id', indexTypeId)
        .eq('period_year', year)
        .eq('period_month', month)
        .single();

    if (error) {
        console.error('Error fetching index value by period:', error);
        return null;
    }

    return data as EconomicIndexValue;
}

/**
 * Get the latest value for an index type
 */
export async function getLatestIndexValue(indexTypeId: string): Promise<EconomicIndexValue | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_values')
        .select('*')
        .eq('index_type_id', indexTypeId)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching latest index value:', error);
        return null;
    }

    return data as EconomicIndexValue;
}

/**
 * Get index history from base period onwards (for adjustment charts)
 */
export async function getIndexHistory(
    indexTypeId: string,
    baseYear: number,
    baseMonth: number
): Promise<EconomicIndexValue[]> {
    const supabase = await createClient();

    // Create a numeric comparison for period (YYYYMM format)
    const basePeriod = baseYear * 100 + baseMonth;

    const { data, error } = await supabase
        .from('economic_index_values')
        .select('*')
        .eq('index_type_id', indexTypeId)
        .or(`period_year.gt.${baseYear},and(period_year.eq.${baseYear},period_month.gte.${baseMonth})`)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true });

    if (error) {
        console.error('Error fetching index history:', error);
        return [];
    }

    return data as EconomicIndexValue[];
}

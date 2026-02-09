"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Periodicity } from "./types";

// ==========================================
// INDEX TYPE ACTIONS
// ==========================================

interface CreateIndexTypeInput {
    organization_id: string;
    name: string;
    description?: string;
    periodicity: Periodicity;
    base_year?: number;
    source?: string;
    components: Array<{
        key: string;
        name: string;
        is_main: boolean;
        sort_order: number;
        color?: string;
    }>;
}

export async function createIndexTypeAction(input: CreateIndexTypeInput) {
    const supabase = await createClient();

    // 1. Create the index type
    const { data: indexType, error: typeError } = await supabase
        .from('economic_index_types')
        .insert({
            organization_id: input.organization_id,
            name: input.name,
            description: input.description || null,
            periodicity: input.periodicity,
            base_year: input.base_year || null,
            source: input.source || null,
            is_system: false,
        })
        .select()
        .single();

    if (typeError) {
        console.error('Error creating index type:', typeError);
        throw new Error(typeError.message || 'Failed to create index type');
    }

    // 2. Create the components
    if (input.components.length > 0) {
        const { error: compError } = await supabase
            .from('economic_index_components')
            .insert(
                input.components.map(comp => ({
                    index_type_id: indexType.id,
                    key: comp.key,
                    name: comp.name,
                    is_main: comp.is_main,
                    sort_order: comp.sort_order,
                    color: comp.color || null,
                }))
            );

        if (compError) {
            console.error('Error creating components:', compError);
            // Rollback: delete the index type
            await supabase.from('economic_index_types').delete().eq('id', indexType.id);
            throw new Error(compError.message || 'Failed to create components');
        }
    }

    revalidatePath('/organization/advanced');
    return indexType;
}

export async function updateIndexTypeAction(
    id: string,
    input: Partial<Omit<CreateIndexTypeInput, 'organization_id' | 'components'>>
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_types')
        .update({
            name: input.name,
            description: input.description,
            periodicity: input.periodicity,
            base_year: input.base_year,
            source: input.source,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating index type:', error);
        throw new Error(sanitizeError(error));
    }

    revalidatePath('/organization/advanced');
    return data;
}

export async function deleteIndexTypeAction(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('economic_index_types')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting index type:', error);
        throw new Error(sanitizeError(error));
    }

    revalidatePath('/organization/advanced');
}

// ==========================================
// INDEX VALUE ACTIONS
// ==========================================

interface CreateIndexValueInput {
    index_type_id: string;
    period_year: number;
    period_month?: number | null;
    period_quarter?: number | null;
    values: Record<string, number>;
    source_url?: string;
    notes?: string;
}

export async function createIndexValueAction(input: CreateIndexValueInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_values')
        .insert({
            index_type_id: input.index_type_id,
            period_year: input.period_year,
            period_month: input.period_month || null,
            period_quarter: input.period_quarter || null,
            values: input.values,
            source_url: input.source_url || null,
            notes: input.notes || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating index value:', error);
        throw new Error(sanitizeError(error));
    }

    revalidatePath('/organization/advanced');
    return data;
}

export async function updateIndexValueAction(
    id: string,
    input: Partial<CreateIndexValueInput>
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_values')
        .update({
            period_year: input.period_year,
            period_month: input.period_month,
            period_quarter: input.period_quarter,
            values: input.values,
            source_url: input.source_url,
            notes: input.notes,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating index value:', error);
        throw new Error(sanitizeError(error));
    }

    revalidatePath('/organization/advanced');
    return data;
}

export async function deleteIndexValueAction(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('economic_index_values')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting index value:', error);
        throw new Error(sanitizeError(error));
    }

    revalidatePath('/organization/advanced');
}

// ==========================================
// COMPONENT ACTIONS
// ==========================================

interface CreateComponentInput {
    index_type_id: string;
    key: string;
    name: string;
    is_main?: boolean;
    sort_order?: number;
    color?: string;
}

export async function createComponentAction(input: CreateComponentInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('economic_index_components')
        .insert({
            index_type_id: input.index_type_id,
            key: input.key,
            name: input.name,
            is_main: input.is_main || false,
            sort_order: input.sort_order || 0,
            color: input.color || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating component:', error);
        throw new Error(sanitizeError(error));
    }

    revalidatePath('/organization/advanced');
    return data;
}

export async function deleteComponentAction(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('economic_index_components')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting component:', error);
        throw new Error(sanitizeError(error));
    }

    revalidatePath('/organization/advanced');
}

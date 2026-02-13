"use server";


import { sanitizeError } from "@/lib/error-utils";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LaborPaymentView, LaborCategory, LaborType, LaborTypeWithPrice, ProjectLabor, ProjectLaborView } from "./types";

// ==========================================
// Labor Categories (Types of workers)
// ==========================================

/**
 * Get labor categories for an organization (includes system categories + org-specific)
 */
export async function getLaborCategories(organizationId: string): Promise<LaborCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('labor_categories')
        .select('*')
        .or(`organization_id.eq.${organizationId},is_system.eq.true`)
        .eq('is_deleted', false)
        .order('is_system', { ascending: false }) // System first
        .order('name');

    if (error) {
        console.error('Error fetching labor categories:', error);
        return [];
    }

    return data as LaborCategory[];
}

/**
 * Get labor types for an organization (includes system types + org-specific)
 * These are the usable types with category + level + role + unit
 */
/**
 * Get all labor types from the system catalog
 * Labor types are now global (no organization_id)
 */
export async function getLaborTypes(): Promise<LaborType[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('labor_types')
        .select(`
            id,
            labor_category_id,
            labor_level_id,
            labor_role_id,
            name,
            description,
            unit_id,
            created_at,
            updated_at,
            labor_categories (name),
            labor_levels (name),
            labor_roles (name),
            units (name, symbol)
        `)
        .order('name');

    if (error) {
        console.error('Error fetching labor types:', error);
        return [];
    }

    return (data || []).map((t: any) => ({
        id: t.id,
        labor_category_id: t.labor_category_id,
        labor_level_id: t.labor_level_id,
        labor_role_id: t.labor_role_id,
        name: t.name,
        description: t.description,
        unit_id: t.unit_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        category_name: t.labor_categories?.name || null,
        level_name: t.labor_levels?.name || null,
        role_name: t.labor_roles?.name || null,
        unit_name: t.units?.name || null,
        unit_symbol: t.units?.symbol || null,
    })) as LaborType[];
}

/**
 * Get labor types with prices for a specific organization
 * Uses labor_prices table to fetch current prices with valid_from
 */
export async function getLaborTypesWithPrices(organizationId: string): Promise<LaborTypeWithPrice[]> {
    const supabase = await createClient();

    // First get all labor types
    const laborTypes = await getLaborTypes();

    // Then get prices for this organization
    const { data: prices, error } = await supabase
        .from('labor_prices')
        .select(`
            id,
            labor_type_id,
            unit_price,
            currency_id,
            valid_from,
            currencies (code, symbol)
        `)
        .eq('organization_id', organizationId)
        .or('valid_to.is.null,valid_to.gte.' + new Date().toISOString().split('T')[0]);

    if (error) {
        console.error('Error fetching labor prices:', error);
    }

    // Map prices by labor_type_id for quick lookup
    const priceMap = new Map<string, { unit_price: number; currency_id: string; code: string; symbol: string; valid_from: string | null }>();
    (prices || []).forEach((p: any) => {
        priceMap.set(p.labor_type_id, {
            unit_price: p.unit_price,
            currency_id: p.currency_id,
            code: p.currencies?.code || '',
            symbol: p.currencies?.symbol || '',
            valid_from: p.valid_from ?? null,
        });
    });

    // Merge types with prices
    return laborTypes.map(lt => {
        const price = priceMap.get(lt.id);
        return {
            ...lt,
            current_price: price?.unit_price ?? null,
            currency_id: price?.currency_id ?? null,
            currency_code: price?.code ?? null,
            currency_symbol: price?.symbol ?? null,
            price_valid_from: price?.valid_from ?? null,
        };
    });
}

/**
 * Upsert a labor price for an organization
 */
export async function upsertLaborPrice(input: {
    organization_id: string;
    labor_type_id: string;
    unit_price: number;
    currency_id: string;
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // First, invalidate any existing price by setting valid_to
    await supabase
        .from('labor_prices')
        .update({ valid_to: new Date().toISOString().split('T')[0] })
        .eq('organization_id', input.organization_id)
        .eq('labor_type_id', input.labor_type_id)
        .is('valid_to', null);

    // Insert new price
    const { error } = await supabase
        .from('labor_prices')
        .insert({
            organization_id: input.organization_id,
            labor_type_id: input.labor_type_id,
            unit_price: input.unit_price,
            currency_id: input.currency_id,
            valid_from: new Date().toISOString().split('T')[0],
            valid_to: null,
        });

    if (error) {
        console.error('Error upserting labor price:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/organization/catalog', 'page');
    return { success: true };
}

interface CreateLaborCategoryInput {
    organization_id: string;
    name: string;
    description?: string | null;
    unit_id?: string | null;
}

export async function createLaborCategory(input: CreateLaborCategoryInput): Promise<{ success: boolean; data?: LaborCategory; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('labor_categories')
        .insert({
            organization_id: input.organization_id,
            name: input.name,
            description: input.description || null,
            unit_id: input.unit_id || null,
            is_system: false, // Never create system categories from UI
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating labor category:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/project/[projectId]/labor', 'page');
    return { success: true, data: data as LaborCategory };
}

interface UpdateLaborCategoryInput extends Partial<CreateLaborCategoryInput> {
    id: string;
}

export async function updateLaborCategory(input: UpdateLaborCategoryInput): Promise<{ success: boolean; data?: LaborCategory; error?: string }> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.unit_id !== undefined) updateData.unit_id = input.unit_id;

    const { data, error } = await supabase
        .from('labor_categories')
        .update(updateData)
        .eq('id', input.id)
        .eq('is_system', false) // Prevent updating system categories
        .select()
        .single();

    if (error) {
        console.error('Error updating labor category:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/project/[projectId]/labor', 'page');
    return { success: true, data: data as LaborCategory };
}

export async function deleteLaborCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('labor_categories')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('is_system', false); // Prevent deleting system categories

    if (error) {
        console.error('Error deleting labor category:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/project/[projectId]/labor', 'page');
    return { success: true };
}

// ==========================================
// ADMIN: System Labor Categories (Oficios)
// ==========================================

interface CreateSystemLaborCategoryInput {
    name: string;
    description?: string | null;
}

/**
 * Create a system labor category (oficio) - admin only
 */
export async function createSystemLaborCategory(input: CreateSystemLaborCategoryInput): Promise<{ success: boolean; data?: LaborCategory; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('labor_categories')
        .insert({
            name: input.name,
            description: input.description || null,
            is_system: true,
            organization_id: null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating system labor category:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true, data: data as LaborCategory };
}

interface UpdateSystemLaborCategoryInput extends Partial<CreateSystemLaborCategoryInput> {
    id: string;
}

/**
 * Update a system labor category (oficio) - admin only
 */
export async function updateSystemLaborCategory(input: UpdateSystemLaborCategoryInput): Promise<{ success: boolean; data?: LaborCategory; error?: string }> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    const { data, error } = await supabase
        .from('labor_categories')
        .update(updateData)
        .eq('id', input.id)
        .eq('is_system', true)
        .select()
        .single();

    if (error) {
        console.error('Error updating system labor category:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true, data: data as LaborCategory };
}

/**
 * Delete a system labor category (oficio) - admin only
 */
export async function deleteSystemLaborCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('labor_categories')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('is_system', true);

    if (error) {
        console.error('Error deleting system labor category:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true };
}

// ==========================================
// ADMIN: System Labor Levels (Niveles)
// ==========================================

interface CreateSystemLaborLevelInput {
    name: string;
    description?: string | null;
}

/**
 * Create a system labor level - admin only
 */
export async function createSystemLaborLevel(input: CreateSystemLaborLevelInput): Promise<{ success: boolean; data?: { id: string; name: string; description: string | null }; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('labor_levels')
        .insert({
            name: input.name,
            description: input.description || null,
            is_system: true,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating system labor level:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true, data };
}

interface UpdateSystemLaborLevelInput extends Partial<CreateSystemLaborLevelInput> {
    id: string;
}

/**
 * Update a system labor level - admin only
 */
export async function updateSystemLaborLevel(input: UpdateSystemLaborLevelInput): Promise<{ success: boolean; data?: { id: string; name: string; description: string | null }; error?: string }> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    const { data, error } = await supabase
        .from('labor_levels')
        .update(updateData)
        .eq('id', input.id)
        .eq('is_system', true)
        .select()
        .single();

    if (error) {
        console.error('Error updating system labor level:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true, data };
}

/**
 * Delete a system labor level - admin only
 */
export async function deleteSystemLaborLevel(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('labor_levels')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('is_system', true);

    if (error) {
        console.error('Error deleting system labor level:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true };
}

// ==========================================
// ADMIN: System Labor Roles (Roles)
// ==========================================

interface CreateSystemLaborRoleInput {
    name: string;
    description?: string | null;
}

/**
 * Create a system labor role - admin only
 */
export async function createSystemLaborRole(input: CreateSystemLaborRoleInput): Promise<{ success: boolean; data?: { id: string; name: string; description: string | null }; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('labor_roles')
        .insert({
            name: input.name,
            description: input.description || null,
            is_system: true,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating system labor role:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true, data };
}

interface UpdateSystemLaborRoleInput extends Partial<CreateSystemLaborRoleInput> {
    id: string;
}

/**
 * Update a system labor role - admin only
 */
export async function updateSystemLaborRole(input: UpdateSystemLaborRoleInput): Promise<{ success: boolean; data?: { id: string; name: string; description: string | null }; error?: string }> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    const { data, error } = await supabase
        .from('labor_roles')
        .update(updateData)
        .eq('id', input.id)
        .eq('is_system', true)
        .select()
        .single();

    if (error) {
        console.error('Error updating system labor role:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true, data };
}

/**
 * Delete a system labor role - admin only
 */
export async function deleteSystemLaborRole(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('labor_roles')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('is_system', true);

    if (error) {
        console.error('Error deleting system labor role:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true };
}

// ==========================================
// ADMIN: System Labor Types (Tipos Usables)
// ==========================================

interface CreateSystemLaborTypeInput {
    name: string;
    description?: string | null;
    labor_category_id: string;
    labor_level_id: string;
    labor_role_id?: string | null;
    unit_id: string;
}

/**
 * Create a system labor type - admin only
 */
export async function createSystemLaborType(input: CreateSystemLaborTypeInput): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('labor_types')
        .insert({
            name: input.name,
            description: input.description || null,
            labor_category_id: input.labor_category_id,
            labor_level_id: input.labor_level_id,
            labor_role_id: input.labor_role_id || null,
            unit_id: input.unit_id,
            is_system: true,
            organization_id: null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating system labor type:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true, data };
}

interface UpdateSystemLaborTypeInput extends Partial<CreateSystemLaborTypeInput> {
    id: string;
}

/**
 * Update a system labor type - admin only
 */
export async function updateSystemLaborType(input: UpdateSystemLaborTypeInput): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.labor_category_id !== undefined) updateData.labor_category_id = input.labor_category_id;
    if (input.labor_level_id !== undefined) updateData.labor_level_id = input.labor_level_id;
    if (input.labor_role_id !== undefined) updateData.labor_role_id = input.labor_role_id;
    if (input.unit_id !== undefined) updateData.unit_id = input.unit_id;

    const { data, error } = await supabase
        .from('labor_types')
        .update(updateData)
        .eq('id', input.id)
        .eq('is_system', true)
        .select()
        .single();

    if (error) {
        console.error('Error updating system labor type:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true, data };
}

/**
 * Delete a system labor type - admin only
 */
export async function deleteSystemLaborType(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('labor_types')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('is_system', true);

    if (error) {
        console.error('Error deleting system labor type:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/admin/catalog', 'page');
    return { success: true };
}

// ==========================================
// Project Labor (Workers assigned to project)
// ==========================================

export async function getProjectLabor(projectId: string): Promise<ProjectLabor[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('project_labor')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching project labor:', error);
        return [];
    }

    return data as ProjectLabor[];
}

/**
 * Get project labor from the view (includes contact info, payments stats, etc.)
 */
export async function getProjectLaborView(projectId: string): Promise<ProjectLaborView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('project_labor_view')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching project labor view:', error);
        return [];
    }

    return data as ProjectLaborView[];
}

interface CreateProjectLaborInput {
    project_id: string;
    organization_id: string;
    contact_id: string;
    labor_type_id?: string | null;
    status: string;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
}

export async function createProjectLabor(input: CreateProjectLaborInput): Promise<{ success: boolean; data?: ProjectLabor; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_labor')
        .insert({
            project_id: input.project_id,
            organization_id: input.organization_id,
            contact_id: input.contact_id,
            labor_type_id: input.labor_type_id || null,
            status: input.status,
            start_date: input.start_date || null,
            end_date: input.end_date || null,
            notes: input.notes || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating project labor:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath(`/project/${input.project_id}/labor`);
    return { success: true, data: data as ProjectLabor };
}

interface UpdateProjectLaborInput extends Partial<CreateProjectLaborInput> {
    id: string;
}

export async function updateProjectLabor(input: UpdateProjectLaborInput): Promise<{ success: boolean; data?: ProjectLabor; error?: string }> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (input.contact_id !== undefined) updateData.contact_id = input.contact_id;
    if (input.labor_type_id !== undefined) updateData.labor_type_id = input.labor_type_id;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const { data, error } = await supabase
        .from('project_labor')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating project labor:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath(`/project/${input.project_id}/labor`);
    return { success: true, data: data as ProjectLabor };
}

export async function deleteProjectLabor(id: string, projectId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('project_labor')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error deleting project labor:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath(`/project/${projectId}/labor`);
    return { success: true };
}

// ==========================================
// Labor Payments
// ==========================================

export async function getLaborPayments(projectId: string): Promise<LaborPaymentView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('labor_payments_view')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching labor payments:', error);
        return [];
    }

    return data as LaborPaymentView[];
}

export async function getLaborPaymentsByOrg(organizationId: string): Promise<LaborPaymentView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('labor_payments_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching labor payments:', error);
        return [];
    }

    return data as LaborPaymentView[];
}

// ==========================================
// Mutations
// ==========================================

export async function createLaborPayment(data: {
    project_id: string;
    organization_id: string;
    labor_id?: string | null;
    amount: number;
    currency_id: string;
    exchange_rate: number;
    payment_date: string;
    wallet_id?: string | null;
    status?: string;
    notes?: string | null;
    reference?: string | null;
}) {
    const supabase = await createClient();
    const { data: newPayment, error } = await supabase
        .from('labor_payments')
        .insert({
            project_id: data.project_id,
            organization_id: data.organization_id,
            labor_id: data.labor_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate,
            payment_date: data.payment_date,
            wallet_id: data.wallet_id,
            status: data.status || 'confirmed',
            notes: data.notes,
            reference: data.reference,
        })
        .select()
        .single();

    if (error) throw new Error(sanitizeError(error));
    revalidatePath(`/project/${data.project_id}/labor`);
    return newPayment;
}

export async function updateLaborPayment(id: string, data: {
    labor_id?: string | null;
    amount?: number;
    currency_id?: string;
    exchange_rate?: number;
    payment_date?: string;
    wallet_id?: string | null;
    status?: string;
    notes?: string | null;
    reference?: string | null;
}, projectId: string) {
    const supabase = await createClient();
    const { data: updatedPayment, error } = await supabase
        .from('labor_payments')
        .update({
            labor_id: data.labor_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate,
            payment_date: data.payment_date,
            wallet_id: data.wallet_id,
            status: data.status,
            notes: data.notes,
            reference: data.reference,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(sanitizeError(error));
    revalidatePath(`/project/${projectId}/labor`);
    return updatedPayment;
}

export async function deleteLaborPayment(id: string, projectId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('labor_payments')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(sanitizeError(error));
    revalidatePath(`/project/${projectId}/labor`);
    return true;
}

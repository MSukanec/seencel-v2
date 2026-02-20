"use server";

import { createClient } from "@/lib/supabase/server";
import { MaterialPaymentView, OrganizationFinancialData, MaterialRequirement } from "./types";

// ===============================================
// Material Payments Queries
// ===============================================

export async function getMaterialPayments(projectId: string): Promise<MaterialPaymentView[]> {
    const supabase = await createClient();

    // Use the VIEW which includes joined fields (wallet, currency, creator info)
    const { data, error } = await supabase
        .from('material_payments_view')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

    if (error) {
        // If view doesn't exist yet, return empty array gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("material_payments_view does not exist yet, returning empty array");
            return [];
        }
        console.error("Error fetching material payments:", error);
        // Return empty array instead of crashing
        return [];
    }

    // Transform to match MaterialPaymentView
    return (data || []).map((p: any) => ({
        ...p,
        purchase_reference: p.invoice_number || null, // Alias for backwards compatibility
    }));
}

/**
 * Get ALL material payments for an organization (no project filter)
 * Used by the unified /organization/materials page
 */
export async function getOrgMaterialPayments(organizationId: string): Promise<MaterialPaymentView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('material_payments_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('payment_date', { ascending: false });

    if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("material_payments_view does not exist yet, returning empty array");
            return [];
        }
        console.error("Error fetching org material payments:", error);
        return [];
    }

    return (data || []).map((p: any) => ({
        ...p,
        purchase_reference: p.invoice_number || null,
    }));
}

// ===============================================
// Organization Financial Data (shared query)
// ===============================================

export async function getOrganizationFinancialData(organizationId: string): Promise<OrganizationFinancialData> {
    const supabase = await createClient();

    // 1. Get Organization Preferences
    const { data: org } = await supabase
        .from('organizations')
        .select('default_currency_id')
        .eq('id', organizationId)
        .single();

    // 2. Get Currencies via view
    const { data: currenciesData } = await supabase
        .from('organization_currencies_view')
        .select('currency_id, currency_name, currency_code, currency_symbol, is_default, exchange_rate')
        .eq('organization_id', organizationId);

    const currencies = (currenciesData || []).map((c: any) => ({
        id: c.currency_id,
        name: c.currency_name,
        code: c.currency_code,
        symbol: c.currency_symbol,
        is_default: c.is_default || false,
        exchange_rate: c.exchange_rate || 1,
    }));

    // 3. Get Wallets via view
    const { data: walletsData } = await supabase
        .from('organization_wallets_view')
        .select('wallet_id, wallet_name, balance, currency_symbol, currency_code, is_default')
        .eq('organization_id', organizationId);

    const wallets = (walletsData || []).map((w: any) => ({
        id: w.wallet_id,
        wallet_id: w.wallet_id,
        name: w.wallet_name,
        balance: w.balance || 0,
        currency_symbol: w.currency_symbol || '$',
        currency_code: w.currency_code,
        is_default: w.is_default || false,
    }));

    // Find defaults
    const defaultCurrency = currencies.find(c => c.is_default) || currencies[0];
    const defaultWallet = wallets.find(w => w.is_default) || wallets[0];

    return {
        defaultCurrencyId: defaultCurrency?.id || org?.default_currency_id || null,
        defaultWalletId: defaultWallet?.id || null,
        currencies,
        wallets,
    };
}

// ===============================================
// Material Catalog Queries (Organization View)
// ===============================================

export interface CatalogMaterial {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
    unit_id: string | null;
    unit_name: string | null;
    unit_symbol: string | null;
    category_id: string | null;
    category_name: string | null;
    material_type: 'material' | 'consumable';
    is_system: boolean;
    organization_id: string | null;
    default_provider_id?: string | null;
    default_sale_unit_id?: string | null;
    default_sale_unit_quantity?: number | null;
    sale_unit_name?: string | null;
    sale_unit_symbol?: string | null;
    // Price fields from view
    org_unit_price?: number | null;
    org_price_currency_id?: string | null;
    org_price_valid_from?: string | null;
}

export interface MaterialCategory {
    id: string;
    name: string;
    parent_id: string | null;
}

export interface MaterialUnit {
    id: string;
    name: string;
    abbreviation: string;
    symbol: string | null;
    applicable_to: string[];
}

export interface MaterialCategoryNode {
    id: string;
    name: string;
    parent_id: string | null;
}

/**
 * Get all materials for an organization catalog
 * Returns both system materials and organization-specific materials
 */
export async function getMaterialsForOrganization(organizationId: string): Promise<CatalogMaterial[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('materials_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

    if (error) {
        // View may have issues after database migrations - return empty gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("materials_view does not exist, returning empty array");
            return [];
        }
        console.error("Error fetching organization materials:", JSON.stringify(error, null, 2));
        return [];
    }

    return (data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        code: m.code || null,
        description: m.description || null,
        unit_id: m.unit_id,
        unit_name: m.unit_of_computation || null,
        unit_symbol: m.unit_symbol || m.unit_of_computation || null,
        category_id: m.category_id,
        category_name: m.category_name || null,
        material_type: m.material_type || 'material',
        is_system: m.is_system,
        organization_id: m.organization_id,
        default_provider_id: m.default_provider_id || null,
        default_sale_unit_id: m.default_sale_unit_id || null,
        default_sale_unit_quantity: m.default_sale_unit_quantity || null,
        sale_unit_name: m.sale_unit_name || null,
        sale_unit_symbol: m.sale_unit_symbol || null,
        org_unit_price: m.org_unit_price,
        org_price_currency_id: m.org_price_currency_id,
        org_price_valid_from: m.org_price_valid_from || null,
    }));
}

/**
 * Get all material categories for dropdown/tree
 */
export async function getMaterialCategoriesForCatalog(): Promise<MaterialCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('material_categories')
        .select('id, name, parent_id')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching material categories:", error);
        return [];
    }

    return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name || '',
        parent_id: c.parent_id
    }));
}

/**
 * Get all units for material form
 */
export async function getUnitsForMaterialCatalog(): Promise<MaterialUnit[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('units')
        .select('id, name, symbol, applicable_to')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching units:", error);
        return [];
    }

    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        abbreviation: u.symbol || u.name,
        symbol: u.symbol,
        applicable_to: u.applicable_to || ['task', 'material', 'labor'],
    }));
}

/**
 * Get material categories hierarchy for tree display
 */
export async function getMaterialCategoryHierarchy(): Promise<MaterialCategoryNode[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('material_categories')
        .select('id, name, parent_id')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching material category hierarchy:", error);
        return [];
    }

    return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name || '',
        parent_id: c.parent_id
    }));
}

// ===============================================
// Material Requirements Queries
// ===============================================

/**
 * Get material requirements for a project
 * Calculated from: construction_tasks.quantity × task_materials.amount
 */
export async function getProjectMaterialRequirements(projectId: string): Promise<MaterialRequirement[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_material_requirements_view')
        .select('*')
        .eq('project_id', projectId)
        .order('material_name', { ascending: true });

    if (error) {
        // If view doesn't exist yet, return empty array gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("project_material_requirements_view does not exist yet, returning empty array");
            return [];
        }
        console.error("Error fetching material requirements:", error);
        return [];
    }

    return (data || []).map((r: any) => ({
        project_id: r.project_id,
        organization_id: r.organization_id,
        material_id: r.material_id,
        material_name: r.material_name || 'Material desconocido',
        unit_name: r.unit_name,
        category_id: r.category_id,
        category_name: r.category_name,
        total_required: parseFloat(r.total_required) || 0,
        task_count: parseInt(r.task_count) || 0,
        construction_task_ids: r.construction_task_ids || [],
    }));
}

/**
 * Get ALL material requirements for an organization (no project filter)
 * Used by the unified /organization/materials page
 */
export async function getOrgMaterialRequirements(organizationId: string): Promise<MaterialRequirement[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_material_requirements_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('material_name', { ascending: true });

    if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("project_material_requirements_view does not exist yet, returning empty array");
            return [];
        }
        console.error("Error fetching org material requirements:", error);
        return [];
    }

    return (data || []).map((r: any) => ({
        project_id: r.project_id,
        organization_id: r.organization_id,
        material_id: r.material_id,
        material_name: r.material_name || 'Material desconocido',
        unit_name: r.unit_name,
        category_id: r.category_id,
        category_name: r.category_name,
        total_required: parseFloat(r.total_required) || 0,
        task_count: parseInt(r.task_count) || 0,
        construction_task_ids: r.construction_task_ids || [],
    }));
}

// ===============================================
// Purchase Orders Queries
// ===============================================

import { PurchaseOrderView, PurchaseOrderItem } from "./types";

/**
 * Get all purchase orders for a project
 */
export async function getPurchaseOrders(projectId: string): Promise<PurchaseOrderView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('material_purchase_orders_view')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("material_purchase_orders_view does not exist yet");
            return [];
        }
        console.error("Error fetching purchase orders:", error);
        return [];
    }

    return (data || []).map((po: any) => ({
        id: po.id,
        organization_id: po.organization_id,
        project_id: po.project_id,
        order_number: po.order_number,
        order_date: po.order_date,
        expected_delivery_date: po.expected_delivery_date,
        status: po.status,
        notes: po.notes,
        currency_id: po.currency_id,
        subtotal: parseFloat(po.subtotal) || 0,
        tax_amount: parseFloat(po.tax_amount) || 0,
        total: parseFloat(po.total) || 0,
        provider_id: po.provider_id,
        provider_name: po.provider_name,
        requested_by: po.requested_by,
        approved_by: po.approved_by,
        is_deleted: po.is_deleted,
        created_at: po.created_at,
        updated_at: po.updated_at,
        currency_symbol: po.currency_symbol,
        currency_code: po.currency_code,
        project_name: po.project_name,
        item_count: parseInt(po.item_count) || 0,
    }));
}

/**
 * Get ALL purchase orders for an organization (no project filter)
 * Used by the unified /organization/materials page
 */
export async function getOrgPurchaseOrders(organizationId: string): Promise<PurchaseOrderView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('material_purchase_orders_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("material_purchase_orders_view does not exist yet");
            return [];
        }
        console.error("Error fetching org purchase orders:", error);
        return [];
    }

    return (data || []).map((po: any) => ({
        id: po.id,
        organization_id: po.organization_id,
        project_id: po.project_id,
        order_number: po.order_number,
        order_date: po.order_date,
        expected_delivery_date: po.expected_delivery_date,
        status: po.status,
        notes: po.notes,
        currency_id: po.currency_id,
        subtotal: parseFloat(po.subtotal) || 0,
        tax_amount: parseFloat(po.tax_amount) || 0,
        total: parseFloat(po.total) || 0,
        provider_id: po.provider_id,
        provider_name: po.provider_name,
        requested_by: po.requested_by,
        approved_by: po.approved_by,
        is_deleted: po.is_deleted,
        created_at: po.created_at,
        updated_at: po.updated_at,
        currency_symbol: po.currency_symbol,
        currency_code: po.currency_code,
        project_name: po.project_name,
        item_count: parseInt(po.item_count) || 0,
    }));
}

/**
 * Get a single purchase order with its items
 */
export async function getPurchaseOrderById(orderId: string): Promise<{
    order: PurchaseOrderView | null;
    items: PurchaseOrderItem[];
}> {
    const supabase = await createClient();

    // Get the order
    const { data: orderData, error: orderError } = await supabase
        .from('material_purchase_orders_view')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !orderData) {
        console.error("Error fetching purchase order:", orderError);
        return { order: null, items: [] };
    }

    // Get the items
    const { data: itemsData, error: itemsError } = await supabase
        .from('material_purchase_order_items')
        .select(`
            *,
            materials (name),
            units (name)
        `)
        .eq('purchase_order_id', orderId)
        .order('created_at', { ascending: true });

    if (itemsError) {
        console.error("Error fetching purchase order items:", itemsError);
    }

    const order: PurchaseOrderView = {
        id: orderData.id,
        organization_id: orderData.organization_id,
        project_id: orderData.project_id,
        order_number: orderData.order_number,
        order_date: orderData.order_date,
        expected_delivery_date: orderData.expected_delivery_date,
        status: orderData.status,
        notes: orderData.notes,
        currency_id: orderData.currency_id,
        subtotal: parseFloat(orderData.subtotal) || 0,
        tax_amount: parseFloat(orderData.tax_amount) || 0,
        total: parseFloat(orderData.total) || 0,
        provider_id: orderData.provider_id,
        provider_name: orderData.provider_name,
        requested_by: orderData.requested_by,
        approved_by: orderData.approved_by,
        is_deleted: orderData.is_deleted,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at,
        currency_symbol: orderData.currency_symbol,
        currency_code: orderData.currency_code,
        project_name: orderData.project_name,
        item_count: parseInt(orderData.item_count) || 0,
    };

    const items: PurchaseOrderItem[] = (itemsData || []).map((item: any) => ({
        id: item.id,
        purchase_order_id: item.purchase_order_id,
        material_id: item.material_id,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unit_id: item.unit_id,
        unit_price: item.unit_price ? parseFloat(item.unit_price) : null,
        notes: item.notes,
        organization_id: item.organization_id,
        project_id: item.project_id,
        created_at: item.created_at,
        created_by: item.created_by,
        material_name: item.materials?.name || null,
        unit_name: item.units?.name || null,
    }));

    return { order, items };
}

/**
 * Get providers (contacts of type supplier) for dropdown
 * Returns: id, name, avatar_url for ContactField component
 */
export async function getProvidersForProject(organizationId: string): Promise<{
    id: string;
    name: string;
    avatar_url: string | null;
}[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company_name, image_url, full_name')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Error fetching providers:", error);
        return [];
    }

    return (data || []).map((c: any) => ({
        id: c.id,
        name: c.full_name || c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Sin nombre',
        avatar_url: c.image_url || null,
    }));
}

/**
 * Get unit presentations for material form
 * @deprecated This function will be removed once unit_presentations table is dropped
 */
export async function getUnitPresentations(): Promise<{
    id: string;
    unit_id: string;
    name: string;
    equivalence: number;
}[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('unit_presentations')
        .select('id, unit_id, name, equivalence')
        .order('name', { ascending: true });

    if (error) {
        // Table may not exist after migration - return empty gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("unit_presentations table does not exist, returning empty array");
            return [];
        }
        console.error("Error fetching unit presentations:", error);
        return [];
    }

    return (data || []).map((p: any) => ({
        id: p.id,
        unit_id: p.unit_id,
        name: p.name,
        equivalence: parseFloat(p.equivalence) || 1,
    }));
}

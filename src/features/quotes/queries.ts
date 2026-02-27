"use server";

import { createClient } from "@/lib/supabase/server";
import { QuoteView, QuoteResources, QuoteResourceMaterial, QuoteResourceLabor, QuoteResourceExternalService } from "./types";

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

// ============================================
// QUOTE RESOURCES (Recipe Breakdown)
// ============================================

/**
 * Get resource breakdown for a quote:
 * - Materials from recipe
 * - Labor from recipe
 * - External services from recipe
 * Aggregates across all items, multiplied by item quantity
 */
export async function getQuoteResources(quoteId: string): Promise<QuoteResources> {
    const supabase = await createClient();

    const empty: QuoteResources = {
        materials: [],
        labor: [],
        externalServices: [],
        totals: { materials: 0, labor: 0, externalServices: 0, grand_total: 0 },
    };

    // 1. Get quote items with recipe_id
    const { data: items, error: itemsErr } = await supabase
        .schema("finance")
        .from("quote_items")
        .select("id, task_id, recipe_id, quantity, cost_scope")
        .eq("quote_id", quoteId)
        .eq("is_deleted", false);

    if (itemsErr || !items || items.length === 0) return empty;

    // Filter items that have a recipe
    const itemsWithRecipe = items.filter((i: any) => i.recipe_id);
    if (itemsWithRecipe.length === 0) return empty;

    const recipeIds = itemsWithRecipe.map((i: any) => i.recipe_id);

    // Build recipe → item quantity map (sum quantities for same recipe)
    // Also need task names for display
    const recipeQuantityMap = new Map<string, { totalQty: number; taskIds: string[] }>();
    for (const item of itemsWithRecipe) {
        const existing = recipeQuantityMap.get(item.recipe_id!) || { totalQty: 0, taskIds: [] };
        existing.totalQty += item.quantity;
        if (item.task_id) existing.taskIds.push(item.task_id);
        recipeQuantityMap.set(item.recipe_id!, existing);
    }

    // 2. Fetch task names for display
    const allTaskIds = [...new Set(itemsWithRecipe.map((i: any) => i.task_id).filter(Boolean))];
    const taskNameMap = new Map<string, string>();
    if (allTaskIds.length > 0) {
        const { data: tasks } = await supabase
            .schema("catalog")
            .from("tasks")
            .select("id, name, custom_name")
            .in("id", allTaskIds);
        if (tasks) {
            for (const t of tasks) {
                taskNameMap.set(t.id, t.custom_name || t.name || "Sin nombre");
            }
        }
    }

    // 3. Fetch recipe materials
    const { data: recipeMaterials } = await supabase
        .schema("catalog")
        .from("task_recipe_materials")
        .select(`
            id, recipe_id, material_id, quantity, total_quantity, waste_percentage, unit_id,
            materials:material_id ( id, name, unit_id, default_sale_unit_quantity ),
            unit:unit_id ( name, symbol )
        `)
        .in("recipe_id", recipeIds)
        .eq("is_deleted", false);

    // 4. Fetch recipe labor
    const { data: recipeLabor } = await supabase
        .schema("catalog")
        .from("task_recipe_labor")
        .select(`
            id, recipe_id, labor_type_id, quantity, unit_id,
            labor_type:labor_type_id ( id, name ),
            unit:unit_id ( name, symbol )
        `)
        .in("recipe_id", recipeIds)
        .eq("is_deleted", false);

    // 5. Fetch recipe external services
    const { data: recipeExtServices } = await supabase
        .schema("catalog")
        .from("task_recipe_external_services")
        .select("id, recipe_id, name, unit_price, contact_id")
        .in("recipe_id", recipeIds)
        .eq("is_deleted", false);

    // 6. Fetch current material prices
    const materialIds = [...new Set((recipeMaterials || []).map((rm: any) => rm.material_id))];
    const materialPriceMap = new Map<string, number>();
    if (materialIds.length > 0) {
        const { data: matPrices } = await supabase
            .schema("catalog")
            .from("material_prices")
            .select("material_id, unit_price, valid_from")
            .in("material_id", materialIds)
            .lte("valid_from", new Date().toISOString().split("T")[0])
            .order("valid_from", { ascending: false });
        if (matPrices) {
            // Keep only latest price per material (already sorted desc)
            for (const mp of matPrices) {
                if (!materialPriceMap.has(mp.material_id)) {
                    materialPriceMap.set(mp.material_id, mp.unit_price);
                }
            }
        }
    }

    // 7. Fetch current labor prices
    const laborTypeIds = [...new Set((recipeLabor || []).map((rl: any) => rl.labor_type_id))];
    const laborPriceMap = new Map<string, number>();
    if (laborTypeIds.length > 0) {
        const { data: labPrices } = await supabase
            .schema("catalog")
            .from("labor_prices")
            .select("labor_type_id, unit_price, valid_from")
            .in("labor_type_id", laborTypeIds)
            .lte("valid_from", new Date().toISOString().split("T")[0])
            .order("valid_from", { ascending: false });
        if (labPrices) {
            for (const lp of labPrices) {
                if (!laborPriceMap.has(lp.labor_type_id)) {
                    laborPriceMap.set(lp.labor_type_id, lp.unit_price);
                }
            }
        }
    }

    // 8. Aggregate materials (group by material_id)
    const materialAgg = new Map<string, QuoteResourceMaterial>();
    for (const rm of recipeMaterials || []) {
        const recipeInfo = recipeQuantityMap.get(rm.recipe_id);
        if (!recipeInfo) continue;

        const mat = rm.materials as any;
        const unit = rm.unit as any;
        const materialId = rm.material_id;
        const saleQty = mat?.default_sale_unit_quantity || 1;
        const unitQtyFromRecipe = rm.total_quantity || rm.quantity || 0;
        const totalQty = unitQtyFromRecipe * recipeInfo.totalQty;
        const price = materialPriceMap.get(materialId) || 0;
        const cost = (totalQty * price) / Math.max(saleQty, 1);

        const taskNames = recipeInfo.taskIds.map(id => taskNameMap.get(id) || "");

        const existing = materialAgg.get(materialId);
        if (existing) {
            existing.total_quantity += totalQty;
            existing.total_cost += cost;
            for (const tn of taskNames) {
                if (tn && !existing.task_names.includes(tn)) existing.task_names.push(tn);
            }
        } else {
            materialAgg.set(materialId, {
                material_id: materialId,
                material_name: mat?.name || "Material desconocido",
                unit_name: unit?.name || null,
                unit_symbol: unit?.symbol || null,
                unit_quantity: unitQtyFromRecipe,
                total_quantity: totalQty,
                waste_percentage: rm.waste_percentage || 0,
                unit_price: price || null,
                total_cost: cost,
                task_names: taskNames.filter(Boolean),
            });
        }
    }

    // 9. Aggregate labor (group by labor_type_id)
    const laborAgg = new Map<string, QuoteResourceLabor>();
    for (const rl of recipeLabor || []) {
        const recipeInfo = recipeQuantityMap.get(rl.recipe_id);
        if (!recipeInfo) continue;

        const laborType = rl.labor_type as any;
        const unit = rl.unit as any;
        const laborTypeId = rl.labor_type_id;
        const unitQty = rl.quantity || 0;
        const totalQty = unitQty * recipeInfo.totalQty;
        const price = laborPriceMap.get(laborTypeId) || 0;
        const cost = totalQty * price;

        const taskNames = recipeInfo.taskIds.map(id => taskNameMap.get(id) || "");

        const existing = laborAgg.get(laborTypeId);
        if (existing) {
            existing.total_quantity += totalQty;
            existing.total_cost += cost;
            for (const tn of taskNames) {
                if (tn && !existing.task_names.includes(tn)) existing.task_names.push(tn);
            }
        } else {
            laborAgg.set(laborTypeId, {
                labor_type_id: laborTypeId,
                labor_name: laborType?.name || "Tipo desconocido",
                unit_name: unit?.name || null,
                unit_symbol: unit?.symbol || null,
                unit_quantity: unitQty,
                total_quantity: totalQty,
                unit_price: price || null,
                total_cost: cost,
                task_names: taskNames.filter(Boolean),
            });
        }
    }

    // 10. Map external services
    const extAgg = new Map<string, QuoteResourceExternalService>();
    for (const es of recipeExtServices || []) {
        const recipeInfo = recipeQuantityMap.get(es.recipe_id);
        if (!recipeInfo) continue;

        const serviceId = es.id;
        const cost = (es.unit_price || 0) * recipeInfo.totalQty;
        const taskNames = recipeInfo.taskIds.map(id => taskNameMap.get(id) || "").filter(Boolean);

        // External services are unique per recipe entry, aggregate by name
        const key = es.name || serviceId;
        const existing = extAgg.get(key);
        if (existing) {
            existing.total_cost += cost;
            for (const tn of taskNames) {
                if (tn && !existing.task_names.includes(tn)) existing.task_names.push(tn);
            }
        } else {
            extAgg.set(key, {
                service_id: serviceId,
                service_name: es.name || "Servicio sin nombre",
                unit_price: es.unit_price || 0,
                contact_name: null, // Contact resolution skipped for simplicity
                task_names: taskNames,
                total_cost: cost,
            });
        }
    }

    const materials = [...materialAgg.values()].sort((a, b) => b.total_cost - a.total_cost);
    const labor = [...laborAgg.values()].sort((a, b) => b.total_cost - a.total_cost);
    const externalServices = [...extAgg.values()].sort((a, b) => b.total_cost - a.total_cost);

    const totalMat = materials.reduce((s, m) => s + m.total_cost, 0);
    const totalLab = labor.reduce((s, l) => s + l.total_cost, 0);
    const totalExt = externalServices.reduce((s, e) => s + e.total_cost, 0);

    return {
        materials,
        labor,
        externalServices,
        totals: {
            materials: totalMat,
            labor: totalLab,
            externalServices: totalExt,
            grand_total: totalMat + totalLab + totalExt,
        },
    };
}

"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Quick Create Catalog Item — AI Panel Integration
//
// Action liviana para crear materiales o tipos de MO desde el panel de
// sugerencias de IA. No requiere FormData ni todos los campos opcionales.
// El usuario solo necesita confirmar nombre y unidad.
// ============================================================================

/** Resultado de una creación rápida desde el panel de sugerencias */
export interface QuickCreateResult {
    success: boolean;
    id?: string;
    name?: string;
    error?: string;
}

/**
 * Crea un material en el catálogo de la organización desde el panel de IA.
 * Mínimo requerido: nombre, organizationId.
 * La unidad es opcional — si no se pasa, el material queda sin unidad asignada.
 */
export async function quickCreateMaterial({
    name,
    organizationId,
    unitId,
}: {
    name: string;
    organizationId: string;
    unitId?: string | null;
}): Promise<QuickCreateResult> {
    try {
        if (!name?.trim()) {
            return { success: false, error: "El nombre es requerido" };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("materials")
            .insert({
                name: name.trim(),
                organization_id: organizationId,
                unit_id: unitId ?? null,
                is_system: false,
            })
            .select("id, name")
            .single();

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: "Ya existe un material con ese nombre" };
            }
            return { success: false, error: error.message };
        }

        return { success: true, id: data.id, name: data.name };
    } catch (e) {
        return { success: false, error: "Error inesperado al crear el material" };
    }
}

/**
 * Crea un tipo de MO en el catálogo de la organización desde el panel de IA.
 * La MO requiere categoría. Si no existe ninguna, se crea con categoría "General".
 */
export async function quickCreateLaborType({
    name,
    organizationId,
    unitId,
}: {
    name: string;
    organizationId: string;
    unitId?: string | null;
}): Promise<QuickCreateResult> {
    try {
        if (!name?.trim()) {
            return { success: false, error: "El nombre es requerido" };
        }

        const supabase = await createClient();

        // Buscar una categoría existente de la org para asignar
        const { data: categories } = await supabase
            .from("labor_categories")
            .select("id")
            .eq("organization_id", organizationId)
            .limit(1)
            .single();

        let categoryId: string | null = categories?.id ?? null;

        // Si no hay categorías, crear "General" automáticamente
        if (!categoryId) {
            const { data: newCat } = await supabase
                .from("labor_categories")
                .insert({ name: "General", organization_id: organizationId })
                .select("id")
                .single();
            categoryId = newCat?.id ?? null;
        }

        const { data, error } = await supabase
            .from("labor_types")
            .insert({
                name: name.trim(),
                organization_id: organizationId,
                unit_id: unitId ?? null,
                category_id: categoryId,
                is_system: false,
            })
            .select("id, name")
            .single();

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: "Ya existe un tipo de MO con ese nombre" };
            }
            return { success: false, error: error.message };
        }

        return { success: true, id: data.id, name: data.name };
    } catch (e) {
        return { success: false, error: "Error inesperado al crear el tipo de MO" };
    }
}

/**
 * Busca una unidad por símbolo (kg, m², l, etc.) para asignar al crear.
 * Retorna el ID si encuentra match, null si no.
 */
export async function findUnitBySymbol(symbol: string): Promise<string | null> {
    try {
        const supabase = await createClient();

        const { data } = await supabase
            .from("units")
            .select("id")
            .ilike("symbol", symbol.trim())
            .limit(1)
            .single();

        return data?.id ?? null;
    } catch {
        return null;
    }
}

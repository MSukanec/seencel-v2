"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Task Divisions (Rubros) import batch processor.
 * Columns: code (optional), name (required), description (optional).
 */
export async function importDivisionsBatch(
    organizationId: string,
    divisions: any[],
    batchId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get current max order for this org's divisions
    const { data: existingDivisions } = await supabase
        .schema('catalog').from("task_divisions")
        .select("order, name")
        .eq("organization_id", organizationId)
        .eq("is_system", false)
        .eq("is_deleted", false)
        .order("order", { ascending: false })
        .limit(1);

    let nextOrder = (existingDivisions?.[0]?.order ?? 0) + 1;

    // Get all existing names for duplicate detection
    const { data: allExisting } = await supabase
        .schema('catalog').from("task_divisions")
        .select("name")
        .eq("organization_id", organizationId)
        .eq("is_system", false)
        .eq("is_deleted", false);

    const existingNames = new Set(
        (allExisting ?? []).map((d) => d.name.toLowerCase().trim())
    );

    // Build records, filtering out duplicates by name
    const records = divisions
        .filter((d) => {
            const name = (d.name || "").trim();
            if (!name) return false; // skip empty names
            if (existingNames.has(name.toLowerCase())) return false; // skip duplicates
            existingNames.add(name.toLowerCase()); // prevent duplicates within batch
            return true;
        })
        .map((d) => ({
            name: (d.name || "").trim(),
            code: d.code ? String(d.code).trim() : null,
            description: d.description ? String(d.description).trim() : null,
            organization_id: organizationId,
            is_system: false,
            order: nextOrder++,
            import_batch_id: batchId,
        }));

    if (records.length === 0) {
        return { success: 0, errors: [], warnings: ["No se encontraron rubros nuevos para importar."] };
    }

    const { error } = await supabase
        .schema('catalog').from("task_divisions")
        .insert(records);

    if (error) {
        console.error("Division import failed:", error);
        throw new Error("Error al importar rubros: " + error.message);
    }

    revalidatePath("/organization/catalog");
    return { success: records.length, errors: [] };
}

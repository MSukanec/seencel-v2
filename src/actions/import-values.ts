"use server";

import { createClient } from "@/lib/supabase/server";

export interface ValuePattern {
    source_value: string;
    target_id: string;
}

/**
 * Retrieves learned value mappings for a specific entity and field.
 * Returns a dictionary: { "Pesos": "uuid-ars", "Dolares": "uuid-usd" }
 */
export async function getValuePatterns(
    organizationId: string,
    entity: string,
    field: string
): Promise<Record<string, string>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ia_import_value_patterns")
        .select("source_value, target_id")
        .eq("organization_id", organizationId)
        .eq("entity", entity)
        .eq("comp_field", field)
        .order("usage_count", { ascending: false });

    if (error) {
        console.error("Error fetching value patterns:", error);
        return {};
    }

    const patterns: Record<string, string> = {};
    data?.forEach(p => {
        // Preferred the most used one
        if (!patterns[p.source_value]) {
            patterns[p.source_value] = p.target_id;
        }
    });

    return patterns;
}

/**
 * Fetches ALL value patterns for a given entity, grouped by field.
 * Returns: { "currency_code": { "Pesos": "uuid-ars" }, "wallet_name": { ... } }
 */
export async function getAllValuePatternsForEntity(
    organizationId: string,
    entity: string
): Promise<Record<string, Record<string, string>>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ia_import_value_patterns")
        .select("comp_field, source_value, target_id")
        .eq("organization_id", organizationId)
        .eq("entity", entity)
        .order("usage_count", { ascending: false });

    if (error) {
        console.error("Error fetching all value patterns:", error);
        return {};
    }

    const result: Record<string, Record<string, string>> = {};

    data?.forEach(p => {
        if (!result[p.comp_field]) {
            result[p.comp_field] = {};
        }
        // First one wins (highest usage)
        if (!result[p.comp_field][p.source_value]) {
            result[p.comp_field][p.source_value] = p.target_id;
        }
    });

    return result;
}

/**
 * Updates or Inserts value mappings after a successful import.
 */
export async function updateValuePatterns(
    organizationId: string,
    entity: string,
    // Map: FieldKey -> { SourceValue -> TargetId }
    // e.g. { "currency_code": { "Pesos": "uuid-ars" } }
    resolutions: Record<string, Record<string, string | null>>
) {
    const supabase = await createClient();
    const updates: Promise<any>[] = [];

    for (const [field, valueMap] of Object.entries(resolutions)) {
        for (const [sourceValue, targetId] of Object.entries(valueMap)) {
            // Only save explicit mappings (not ignore/null)
            if (!targetId) continue;

            updates.push((async () => {
                // Check existance
                const { data: existing } = await supabase
                    .from("ia_import_value_patterns")
                    .select("id, usage_count")
                    .eq("organization_id", organizationId)
                    .eq("entity", entity)
                    .eq("comp_field", field)
                    .eq("source_value", sourceValue)
                    .single();

                if (existing) {
                    // Update usage if target creates a reinforcement (same target) or override?
                    // If target is different, we might want to update the target to the new preference.
                    // For now, let's assume we update to the LATEST choice.
                    await supabase.from("ia_import_value_patterns")
                        .update({
                            target_id: targetId, // Update target to latest choice
                            usage_count: existing.usage_count + 1,
                            last_used_at: new Date().toISOString()
                        })
                        .eq("id", existing.id);
                } else {
                    // Insert new
                    await supabase.from("ia_import_value_patterns")
                        .insert({
                            organization_id: organizationId,
                            entity: entity,
                            comp_field: field,
                            source_value: sourceValue,
                            target_id: targetId,
                            usage_count: 1
                        });
                }
            })());
        }
    }

    await Promise.allSettled(updates);
}

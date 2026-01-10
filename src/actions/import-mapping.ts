"use server";

import { createClient } from "@/lib/supabase/server";

export async function getMappingPatterns(organizationId: string, entity: string) {
    const supabase = await createClient();

    // Fetch patterns ordered by usage_count (popularity)
    const { data, error } = await supabase
        .from("ia_import_mapping_patterns")
        .select("source_header, target_field")
        .eq("organization_id", organizationId)
        .eq("entity", entity)
        .order("usage_count", { ascending: false });

    if (error) {
        console.error("Error fetching mapping patterns:", error);
        return {};
    }

    // Convert to dictionary: { "Correo": "email", "Celular": "phone" }
    // Since we ordered by usage_count desc, the first occurence (most popular) wins if duplicates exist
    const patterns: Record<string, string> = {};
    data?.forEach(p => {
        // Normalize key for case-insensitive matching later if needed, 
        // but for now let's keep exact string to allow specific preferences
        if (!patterns[p.source_header]) {
            patterns[p.source_header] = p.target_field;
        }
    });

    return patterns;
}

export async function updateMappingPatterns(
    organizationId: string,
    entity: string,
    mapping: Record<string, string>
) {
    const supabase = await createClient();

    // We process each mapping pair
    // In a high-throughput scenario we might want to batch this differently,
    // but for import configuration this is fine.

    const updates = Object.entries(mapping).map(async ([sourceHeader, targetField]) => {
        if (!targetField) return; // Skip ignored columns

        // Check if exists pattern for this org+entity+header+target
        const { data: existing } = await supabase
            .from("ia_import_mapping_patterns")
            .select("id, usage_count")
            .eq("organization_id", organizationId)
            .eq("entity", entity)
            .eq("source_header", sourceHeader)
            .eq("target_field", targetField)
            .single();

        if (existing) {
            // Increment usage
            await supabase.from("ia_import_mapping_patterns")
                .update({
                    usage_count: existing.usage_count + 1,
                    last_used_at: new Date().toISOString()
                })
                .eq("id", existing.id);
        } else {
            // Create new
            await supabase.from("ia_import_mapping_patterns")
                .insert({
                    organization_id: organizationId,
                    entity: entity,
                    source_header: sourceHeader,
                    target_field: targetField,
                    usage_count: 1
                });
        }
    });

    await Promise.all(updates);
}

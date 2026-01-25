"use server";

import { createClient } from "@/lib/supabase/server";

export async function getMappingPatterns(organizationId: string, entity: string) {
    const supabase = await createClient();

    // Fetch patterns from ALL organizations (Community Intelligence)
    // We order by:
    // 1. Current Organization (Custom preferences) - handled in code sort/filter or just fetch logic
    // 2. Global Popularity (usage_count)

    const { data, error } = await supabase
        .from("ia_import_mapping_patterns")
        .select("organization_id, source_header, target_field, usage_count")
        .eq("entity", entity)
        .order("usage_count", { ascending: false });

    if (error) {
        console.error("Error fetching mapping patterns:", error);
        return {};
    }

    // Convert to dictionary: { "Correo": "email" }
    const patterns: Record<string, string> = {};

    // First pass: Populate with GLOBAL popular patterns
    data?.forEach(p => {
        if (!patterns[p.source_header]) {
            patterns[p.source_header] = p.target_field;
        }
    });

    // Second pass: OVERWRITE with LOCAL preferences (Specific to this Org)
    // Since we want local to win, we check if the row belongs to us
    data?.forEach(p => {
        if (p.organization_id === organizationId) {
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


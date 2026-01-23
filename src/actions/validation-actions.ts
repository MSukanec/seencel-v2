"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Checks for existing values in a specific table/column for an organization.
 * Used to warn users about potential duplicates during import.
 */
export async function checkDuplicates(
    organizationId: string,
    table: string,
    field: string,
    values: string[]
): Promise<string[]> {
    const supabase = await createClient();

    // Normalize and filter unique non-empty values
    const uniqueValues = Array.from(new Set(values.filter(v => v)));
    if (uniqueValues.length === 0) return [];

    const duplicates: string[] = [];
    const chunkSize = 100;

    for (let i = 0; i < uniqueValues.length; i += chunkSize) {
        const chunk = uniqueValues.slice(i, i + chunkSize);

        try {
            const { data, error } = await supabase
                .from(table)
                .select(field)
                .eq('organization_id', organizationId)
                .in(field, chunk);

            if (error) {
                console.error("Error checking duplicates:", error);
                continue;
            }

            if (data) {
                duplicates.push(...data.map((d: any) => d[field]));
            }
        } catch (e) {
            console.error("Exception checking duplicates:", e);
        }
    }

    return duplicates;
}


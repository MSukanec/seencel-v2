"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Tasks catalog import batch processor
 * Imports tasks from Excel/CSV with automatic division creation
 */
export async function importTasksCatalogBatch(
    organizationId: string,
    tasks: any[],
    batchId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get organization member ID for audit
    const { data: memberData } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single();
    const memberId = memberData?.id || null;

    // 1. Get divisions for name lookup (filter by org + system)
    const { data: divisions, error: divError } = await supabase
        .schema('catalog').from('task_divisions')
        .select('id, name, code')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false);

    if (divError) {
        console.error('[Import] Failed to fetch divisions:', divError);
    }

    const divisionMap = new Map<string, string>();
    divisions?.forEach((d: any) => {
        if (d.name) divisionMap.set(d.name.toLowerCase().trim(), d.id);
        if (d.code) divisionMap.set(d.code.toLowerCase().trim(), d.id);
    });
    console.log(`[Import] Found ${divisionMap.size} divisions`);

    // 2. Get units for name/symbol lookup (system + org)
    const { data: units } = await supabase
        .schema('catalog').from('units')
        .select('id, name, symbol, organization_id')
        .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
        .eq('is_deleted', false);

    const unitMap = new Map<string, string>();
    units?.forEach((u: any) => {
        if (u.name) unitMap.set(u.name.toLowerCase().trim(), u.id);
        if (u.symbol) unitMap.set(u.symbol.toLowerCase().trim(), u.id);
    });

    // 3. Get existing task names for duplicate detection
    const { data: existingTasks } = await supabase
        .schema('catalog').from('tasks')
        .select('name, code')
        .or(`organization_id.eq.${organizationId},is_system.eq.true`)
        .eq('is_deleted', false);

    const existingNames = new Set<string>();
    const existingCodes = new Set<string>();
    existingTasks?.forEach((t: any) => {
        if (t.name) existingNames.add(t.name.toLowerCase().trim());
        if (t.code) existingCodes.add(t.code.toLowerCase().trim());
    });

    // 4. Transform and validate records - collect items to create
    const errors: any[] = [];
    const divisionsToCreate = new Map<string, string>(); // name -> original name
    const unitsToCreate = new Map<string, string>(); // name -> original name

    const parsedTasks = tasks.map((task, index) => {
        const name = String(task.name || '').trim();

        if (!name) {
            errors.push({ row: index + 1, error: 'Nombre es requerido' });
            return null;
        }

        // Check for duplicates by name
        if (existingNames.has(name.toLowerCase())) {
            errors.push({ row: index + 1, error: `Tarea duplicada: "${name}"` });
            return null;
        }

        // Check for duplicates by code
        const code = task.code ? String(task.code).trim() : null;
        if (code && existingCodes.has(code.toLowerCase())) {
            errors.push({ row: index + 1, error: `Código duplicado: "${code}"` });
            return null;
        }

        // Mark as used to prevent duplicates within import
        existingNames.add(name.toLowerCase());
        if (code) existingCodes.add(code.toLowerCase());

        // Resolve or mark division for creation
        let division_id = null;
        let divisionToCreate: string | null = null;
        if (task.division_name) {
            const rawValue = String(task.division_name).trim();

            // Check if rawValue is already a UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawValue);

            if (isUUID) {
                division_id = rawValue;
            } else {
                const directMatch = divisions?.find(d => d.id === rawValue);
                if (directMatch) {
                    division_id = directMatch.id;
                } else {
                    division_id = divisionMap.get(rawValue.toLowerCase()) || null;
                    if (!division_id && rawValue) {
                        // Mark for creation
                        divisionToCreate = rawValue;
                        if (!divisionsToCreate.has(rawValue.toLowerCase())) {
                            divisionsToCreate.set(rawValue.toLowerCase(), rawValue);
                        }
                    }
                }
            }
        }

        // Resolve or mark unit for creation
        let unit_id = null;
        let unitToCreate: string | null = null;
        if (task.unit_name) {
            const rawValue = String(task.unit_name).trim();
            const directMatch = units?.find(u => u.id === rawValue);
            if (directMatch) {
                unit_id = directMatch.id;
            } else {
                unit_id = unitMap.get(rawValue.toLowerCase()) || null;
                if (!unit_id && rawValue) {
                    // Mark for creation
                    unitToCreate = rawValue;
                    if (!unitsToCreate.has(rawValue.toLowerCase())) {
                        unitsToCreate.set(rawValue.toLowerCase(), rawValue);
                    }
                }
            }
        }

        return {
            name,
            code,
            description: task.description ? String(task.description).trim() : null,
            division_id,
            divisionToCreate,
            unit_id,
            unitToCreate,
            index,
        };
    }).filter(Boolean) as any[];

    // 5. Create missing divisions
    let divisionsCreated = 0;
    if (divisionsToCreate.size > 0) {
        const divisionInserts = Array.from(divisionsToCreate.values()).map(name => ({
            name,
            organization_id: organizationId,
            is_deleted: false,
        }));

        console.log(`[Import] Creating ${divisionInserts.length} new divisions:`, divisionInserts.map(d => d.name));

        const { data: newDivisions, error: divisionError } = await supabase
            .schema('catalog').from('task_divisions')
            .insert(divisionInserts)
            .select('id, name');

        if (divisionError) {
            console.error('[Import] Failed to create divisions:', divisionError);
        } else if (newDivisions) {
            divisionsCreated = newDivisions.length;
            console.log(`[Import] Successfully created ${newDivisions.length} divisions`);
            newDivisions.forEach((d: any) => {
                divisionMap.set(d.name.toLowerCase().trim(), d.id);
            });
        }
    }

    // 6. Create missing units
    let unitsCreatedCount = 0;
    if (unitsToCreate.size > 0) {
        const unitInserts = Array.from(unitsToCreate.values()).map(name => ({
            name,
            symbol: name.substring(0, 10), // Use first 10 chars as symbol
            organization_id: organizationId,
            is_system: false,
        }));

        const { data: newUnits, error: unitError } = await supabase
            .schema('catalog').from('units')
            .insert(unitInserts)
            .select('id, name');

        if (!unitError && newUnits) {
            unitsCreatedCount = newUnits.length;
            newUnits.forEach((u: any) => {
                unitMap.set(u.name.toLowerCase().trim(), u.id);
            });
        }
    }

    // 7. Prepare final records with resolved IDs
    const records = parsedTasks.map(task => {
        // Resolve division_id if it was marked for creation
        let task_division_id = task.division_id;
        if (!task_division_id && task.divisionToCreate) {
            task_division_id = divisionMap.get(task.divisionToCreate.toLowerCase()) || null;
        }

        // Resolve unit_id if it was marked for creation
        let unit_id = task.unit_id;
        if (!unit_id && task.unitToCreate) {
            unit_id = unitMap.get(task.unitToCreate.toLowerCase()) || null;
        }

        // Default to first available unit if none specified
        if (!unit_id && units && units.length > 0) {
            unit_id = units[0].id;
        }

        return {
            name: task.name,
            code: task.code,
            description: task.description,
            organization_id: organizationId,
            task_division_id,
            unit_id,
            is_system: false,
            is_published: true, // Import as published by default
            is_deleted: false,
            import_batch_id: batchId,
            created_by: memberId,
            updated_by: memberId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    });

    if (errors.length > 0) {
        console.warn("Task catalog import warnings:", errors);
    }

    // 8. Insert valid records
    const insertedTasks: any[] = [];
    if (records.length > 0) {
        const { data: inserted, error } = await supabase
            .schema('catalog').from('tasks')
            .insert(records)
            .select('id, name');

        if (error) {
            console.error("Bulk task catalog insert failed:", error);
            throw new Error("Bulk insert failed: " + error.message);
        }

        if (inserted) {
            insertedTasks.push(...inserted);
        }
    }

    revalidatePath('/organization/catalog');
    return {
        success: insertedTasks.length,
        errors,
        skipped: tasks.length - insertedTasks.length,
        created: {
            divisions: divisionsCreated,
            units: unitsCreatedCount,
        }
    };
}

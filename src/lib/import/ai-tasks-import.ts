"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AIAnalysisResult, AIAnalyzedTask } from "@/features/ai/types";
import { createImportBatch } from "@/lib/import";

/**
 * Import tasks with recipes from AI analysis results.
 *
 * Flow:
 * 1. Create import batch for tracking
 * 2. Resolve existing units, materials, and labor types by name
 * 3. Create tasks in `tasks` table
 * 4. Create recipes in `task_recipes` for tasks that have resources
 * 5. Create recipe materials and recipe labor linking to existing catalog items
 *
 * Materials and labor that don't match existing catalog items are SKIPPED
 * (reported as warnings). The user can add them manually later.
 */
export async function importAITasksBatch(
    organizationId: string,
    analysisResult: AIAnalysisResult,
): Promise<{ success: number; errors: any[]; warnings?: string[]; batchId?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get member ID for audit
    const { data: memberData } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single();
    const memberId = memberData?.id || null;

    // Create import batch
    const batch = await createImportBatch(organizationId, "tasks_catalog_ai", analysisResult.tasks.length);

    // ========================================================================
    // 1. Load reference data for matching
    // ========================================================================

    // Units
    const { data: units } = await supabase
        .from('units')
        .select('id, name, symbol')
        .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
        .eq('is_deleted', false);

    const unitMap = new Map<string, string>();
    units?.forEach(u => {
        if (u.name) unitMap.set(u.name.toLowerCase().trim(), u.id);
        if (u.symbol) unitMap.set(u.symbol.toLowerCase().trim(), u.id);
    });

    // Materials
    const { data: materials } = await supabase
        .from('materials')
        .select('id, name, code')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false);

    const materialMap = new Map<string, string>();
    materials?.forEach(m => {
        if (m.name) materialMap.set(m.name.toLowerCase().trim(), m.id);
        if (m.code) materialMap.set(m.code.toLowerCase().trim(), m.id);
    });

    // Labor types
    const { data: laborTypes } = await supabase
        .from('labor_types')
        .select('id, name')
        .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
        .eq('is_deleted', false);

    const laborMap = new Map<string, string>();
    laborTypes?.forEach(l => {
        if (l.name) laborMap.set(l.name.toLowerCase().trim(), l.id);
    });

    // Existing tasks for duplicate detection
    const { data: existingTasks } = await supabase
        .from('tasks')
        .select('name, code')
        .or(`organization_id.eq.${organizationId},is_system.eq.true`)
        .eq('is_deleted', false);

    const existingNames = new Set<string>();
    const existingCodes = new Set<string>();
    existingTasks?.forEach(t => {
        if (t.name) existingNames.add(t.name.toLowerCase().trim());
        if (t.code) existingCodes.add(t.code.toLowerCase().trim());
    });

    // Divisions
    const { data: divisions } = await supabase
        .from('task_divisions')
        .select('id, name, code')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false);

    const divisionMap = new Map<string, string>();
    divisions?.forEach(d => {
        if (d.name) divisionMap.set(d.name.toLowerCase().trim(), d.id);
        if (d.code) divisionMap.set(d.code.toLowerCase().trim(), d.id);
    });

    // ========================================================================
    // 2. Process each AI-detected task
    // ========================================================================

    const errors: any[] = [];
    const warnings: string[] = [];
    const tasksToInsert: any[] = [];
    const taskIndexMap: number[] = []; // Maps insertion index → original AI task index

    for (let i = 0; i < analysisResult.tasks.length; i++) {
        const aiTask = analysisResult.tasks[i];
        const name = (aiTask.name || '').trim();

        if (!name) {
            errors.push({ row: aiTask.sourceRow, error: 'Tarea sin nombre' });
            continue;
        }

        // Duplicate check
        if (existingNames.has(name.toLowerCase())) {
            errors.push({ row: aiTask.sourceRow, error: `Tarea duplicada: "${name}"` });
            continue;
        }
        if (aiTask.code && existingCodes.has(aiTask.code.toLowerCase().trim())) {
            errors.push({ row: aiTask.sourceRow, error: `Código duplicado: "${aiTask.code}"` });
            continue;
        }

        // Mark as used
        existingNames.add(name.toLowerCase());
        if (aiTask.code) existingCodes.add(aiTask.code.toLowerCase().trim());

        // Resolve unit
        const unitId = aiTask.unit ? resolveUnit(aiTask.unit, unitMap) : null;

        tasksToInsert.push({
            name,
            code: aiTask.code || null,
            organization_id: organizationId,
            unit_id: unitId || (units && units.length > 0 ? units[0].id : null),
            is_system: false,
            is_published: true,
            is_deleted: false,
            import_batch_id: batch.id,
            created_by: memberId,
            updated_by: memberId,
        });
        taskIndexMap.push(i);
    }

    if (tasksToInsert.length === 0) {
        return { success: 0, errors, warnings, batchId: batch.id };
    }

    // ========================================================================
    // 3. Insert tasks
    // ========================================================================

    const { data: insertedTasks, error: taskError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select('id, name');

    if (taskError) {
        console.error("[AI Import] Task insert failed:", taskError);
        throw new Error("Error al insertar tareas: " + taskError.message);
    }

    if (!insertedTasks || insertedTasks.length === 0) {
        return { success: 0, errors, warnings, batchId: batch.id };
    }

    // ========================================================================
    // 4. Create recipes for tasks with resources
    // ========================================================================

    const recipesToInsert: any[] = [];
    const recipeTaskLinks: { taskDbId: string; aiTaskIndex: number }[] = [];

    for (let j = 0; j < insertedTasks.length; j++) {
        const dbTask = insertedTasks[j];
        const aiIndex = taskIndexMap[j];
        const aiTask = analysisResult.tasks[aiIndex];

        if (aiTask.materials.length > 0 || aiTask.labor.length > 0) {
            recipesToInsert.push({
                task_id: dbTask.id,
                organization_id: organizationId,
                name: `Receta - ${dbTask.name}`,
                import_batch_id: batch.id,
                created_by: memberId,
                updated_by: memberId,
            });
            recipeTaskLinks.push({ taskDbId: dbTask.id, aiTaskIndex: aiIndex });
        }
    }

    if (recipesToInsert.length > 0) {
        const { data: insertedRecipes, error: recipeError } = await supabase
            .from('task_recipes')
            .insert(recipesToInsert)
            .select('id, task_id');

        if (recipeError) {
            console.error("[AI Import] Recipe insert failed:", recipeError);
            warnings.push(`No se pudieron crear las recetas: ${recipeError.message}`);
        } else if (insertedRecipes) {
            // ================================================================
            // 5. Insert recipe materials and labor
            // ================================================================

            const materialsToInsert: any[] = [];
            const laborToInsert: any[] = [];
            let skippedMaterials = 0;
            let skippedLabor = 0;
            let crossMatchedMaterials: string[] = [];
            let crossMatchedLabor: string[] = [];

            for (const recipe of insertedRecipes) {
                const link = recipeTaskLinks.find(l => l.taskDbId === recipe.task_id);
                if (!link) continue;

                const aiTask = analysisResult.tasks[link.aiTaskIndex];

                // Materials
                for (const mat of aiTask.materials) {
                    const matName = (mat.name || '').trim();
                    const materialId = materialMap.get(matName.toLowerCase());

                    if (!materialId) {
                        // Cross-catalog check: is this name in labor_types?
                        const crossMatch = laborMap.get(matName.toLowerCase());
                        if (crossMatch) {
                            crossMatchedMaterials.push(matName);
                        }
                        skippedMaterials++;
                        continue; // Skip — material not in catalog
                    }

                    const matUnitId = mat.unit ? resolveUnit(mat.unit, unitMap) : null;

                    materialsToInsert.push({
                        recipe_id: recipe.id,
                        material_id: materialId,
                        quantity: mat.quantity || 1,
                        unit_id: matUnitId,
                        waste_percentage: mat.wastePercentage || 0,
                        organization_id: organizationId,
                        import_batch_id: batch.id,
                        created_by: memberId,
                        updated_by: memberId,
                    });
                }

                // Labor
                for (const lab of aiTask.labor) {
                    const labName = (lab.name || '').trim();
                    const laborTypeId = laborMap.get(labName.toLowerCase());

                    if (!laborTypeId) {
                        // Cross-catalog check: is this name in materials?
                        const crossMatch = materialMap.get(labName.toLowerCase());
                        if (crossMatch) {
                            crossMatchedLabor.push(labName);
                        }
                        skippedLabor++;
                        continue; // Skip — labor type not in catalog
                    }

                    const labUnitId = lab.unit ? resolveUnit(lab.unit, unitMap) : null;

                    laborToInsert.push({
                        recipe_id: recipe.id,
                        labor_type_id: laborTypeId,
                        quantity: lab.quantity || 1,
                        unit_id: labUnitId,
                        organization_id: organizationId,
                        import_batch_id: batch.id,
                        created_by: memberId,
                        updated_by: memberId,
                    });
                }
            }

            // Batch insert materials
            if (materialsToInsert.length > 0) {
                const { error: matError } = await supabase
                    .from('task_recipe_materials')
                    .insert(materialsToInsert);

                if (matError) {
                    console.error("[AI Import] Material insert failed:", matError);
                    warnings.push(`Error al insertar materiales de receta: ${matError.message}`);
                }
            }

            // Batch insert labor
            if (laborToInsert.length > 0) {
                const { error: labError } = await supabase
                    .from('task_recipe_labor')
                    .insert(laborToInsert);

                if (labError) {
                    console.error("[AI Import] Labor insert failed:", labError);
                    warnings.push(`Error al insertar mano de obra de receta: ${labError.message}`);
                }
            }

            // Report skipped resources
            if (skippedMaterials > 0) {
                warnings.push(`${skippedMaterials} material(es) no encontrado(s) en el catálogo — se omitieron de las recetas.`);
            }
            if (skippedLabor > 0) {
                warnings.push(`${skippedLabor} tipo(s) de mano de obra no encontrado(s) en el catálogo — se omitieron de las recetas.`);
            }

            // Cross-catalog warnings
            if (crossMatchedMaterials.length > 0) {
                const items = crossMatchedMaterials.slice(0, 5).map(n => `"${n}"`).join(', ');
                const extra = crossMatchedMaterials.length > 5 ? ` y ${crossMatchedMaterials.length - 5} más` : '';
                warnings.push(
                    `⚠️ Posible error de clasificación: ${crossMatchedMaterials.length} item(s) listados como MATERIALES en tu archivo (${items}${extra}) existen en tu catálogo de Mano de Obra pero NO en Materiales. ¿Puede que hayan sido importados en la categoría incorrecta?`
                );
            }
            if (crossMatchedLabor.length > 0) {
                const items = crossMatchedLabor.slice(0, 5).map(n => `"${n}"`).join(', ');
                const extra = crossMatchedLabor.length > 5 ? ` y ${crossMatchedLabor.length - 5} más` : '';
                warnings.push(
                    `⚠️ Posible error de clasificación: ${crossMatchedLabor.length} item(s) listados como MANO DE OBRA en tu archivo (${items}${extra}) existen en tu catálogo de Materiales pero NO en Mano de Obra. ¿Puede que hayan sido importados en la categoría incorrecta?`
                );
            }

            // Summary
            const totalMats = materialsToInsert.length;
            const totalLabor = laborToInsert.length;
            if (totalMats > 0 || totalLabor > 0) {
                warnings.push(`Se crearon ${insertedRecipes.length} receta(s) con ${totalMats} material(es) y ${totalLabor} tipo(s) de MO vinculados.`);
            }
        }
    }

    revalidatePath('/organization/catalog');
    return {
        success: insertedTasks.length,
        errors,
        warnings,
        batchId: batch.id,
    };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Try to resolve a unit string to a unit ID.
 * Handles common abbreviations and normalizations.
 */
function resolveUnit(unitStr: string, unitMap: Map<string, string>): string | null {
    const normalized = unitStr.toLowerCase().trim();

    // Direct match
    const direct = unitMap.get(normalized);
    if (direct) return direct;

    // Common abbreviation aliases
    const aliases: Record<string, string[]> = {
        'm2': ['m²', 'm2'],
        'm3': ['m³', 'm3'],
        'ml': ['ml', 'metro lineal', 'metros lineales'],
        'u': ['u', 'un', 'unidad', 'unidades'],
        'gl': ['gl', 'global'],
        'kg': ['kg', 'kilogramo', 'kilogramos'],
        'lt': ['lt', 'l', 'litro', 'litros'],
    };

    for (const [canonical, variants] of Object.entries(aliases)) {
        if (variants.includes(normalized)) {
            // Try canonical first, then each variant
            const found = unitMap.get(canonical) ||
                variants.map(v => unitMap.get(v)).find(Boolean);
            if (found) return found;
        }
    }

    return null;
}

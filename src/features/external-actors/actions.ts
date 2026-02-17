"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createExternalActorSchema, updateExternalActorSchema } from "./types";

// ===============================================
// Create External Actor
// ===============================================

export async function addExternalActorAction(
    input: z.infer<typeof createExternalActorSchema>
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("organization_external_actors")
        .insert({
            organization_id: input.organization_id,
            user_id: input.user_id,
            actor_type: input.actor_type,
            is_active: input.is_active ?? true,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            throw new Error(
                "Este usuario ya es actor externo de esta organización."
            );
        }
        console.error("Error adding external actor:", error);
        throw new Error("Error al agregar actor externo.");
    }

    revalidatePath("/organization/team");
    return data;
}

// ===============================================
// Update External Actor
// ===============================================

export async function updateExternalActorAction(
    input: z.infer<typeof updateExternalActorSchema>
) {
    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {};
    if (input.actor_type !== undefined) updatePayload.actor_type = input.actor_type;
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

    const { data, error } = await supabase
        .from("organization_external_actors")
        .update(updatePayload)
        .eq("id", input.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating external actor:", error);
        throw new Error("Error al actualizar actor externo.");
    }

    revalidatePath("/organization/team");
    return data;
}

// ===============================================
// Remove External Actor (soft delete)
// ===============================================

export async function removeExternalActorAction(actorId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("organization_external_actors")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", actorId);

    if (error) {
        console.error("Error removing external actor:", error);
        throw new Error("Error al eliminar actor externo.");
    }

    revalidatePath("/organization/team");
}

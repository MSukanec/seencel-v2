"use server";

import { createClient } from "@/lib/supabase/server";
import { SignatureData } from "@/components/ui/signature-pad";
import { headers } from "next/headers";

interface ApproveQuoteParams {
    quoteId: string;
    projectId: string;
    clientId: string;
    signatureData: SignatureData;
}

interface RejectQuoteParams {
    quoteId: string;
    projectId: string;
    clientId: string;
    reason: string;
}

export async function approveQuote({ quoteId, projectId, clientId, signatureData }: ApproveQuoteParams) {
    const supabase = await createClient();
    const headersList = await headers();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "No autenticado" };
    }

    // Get internal user id from public.users
    const { data: internalUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!internalUser) {
        return { error: "Usuario no encontrado" };
    }

    // Get quote details to verify it exists and is in correct status
    const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select("id, organization_id, status, name")
        .eq("id", quoteId)
        .single();

    if (quoteError || !quote) {
        return { error: "Presupuesto no encontrado" };
    }

    if (quote.status !== "sent") {
        return { error: "Este presupuesto no está pendiente de aprobación" };
    }

    // Upload signature image to storage
    const base64Data = signatureData.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${quoteId}_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(fileName, buffer, {
            contentType: "image/png",
            upsert: false,
        });

    if (uploadError) {
        console.error("Error uploading signature:", uploadError);
        // Continue without storage if it fails (signature data is still in the record)
    }

    // Get public URL for the signature
    const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(fileName);

    const signatureUrl = urlData?.publicUrl || signatureData.imageBase64;

    // Create signature record
    const { error: sigError } = await supabase
        .from("signatures")
        .insert({
            organization_id: quote.organization_id,
            document_type: "quote",
            document_id: quoteId,
            signer_name: signatureData.signerName,
            signer_email: user.email,
            signer_user_id: user.id,
            signature_url: signatureUrl,
            signature_method: signatureData.method,
            ip_address: headersList.get("x-forwarded-for") || headersList.get("x-real-ip"),
            user_agent: headersList.get("user-agent"),
            signed_at: signatureData.timestamp,
        });

    if (sigError) {
        console.error("Error creating signature record:", sigError);
        // Continue - the quote update is more important
    }

    // Update quote status to approved
    const { error: updateError, data: updated } = await supabase
        .from("quotes")
        .update({
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: internalUser.id, // FK to public.users
        })
        .eq("id", quoteId)
        .select();

    if (updateError) {
        console.error("Error updating quote:", updateError);
        return { error: `Error al actualizar: ${updateError.message}` };
    }

    if (!updated || updated.length === 0) {
        return { error: "RLS bloqueó la actualización" };
    }

    // Create activity log
    await supabase.from("activity_logs").insert({
        organization_id: quote.organization_id,
        entity_type: "quote",
        entity_id: quoteId,
        action: "approved",
        actor_id: user.id,
        actor_type: "client_representative",
        description: `Presupuesto "${quote.name}" aprobado por ${signatureData.signerName}`,
        metadata: {
            signature_method: signatureData.method,
            signer_name: signatureData.signerName,
        },
    });

    // TODO: Send notification to organization admins

    return { success: true, error: null };
}

export async function rejectQuote({ quoteId, projectId, clientId, reason }: RejectQuoteParams) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "No autenticado" };
    }

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select("id, organization_id, status, name")
        .eq("id", quoteId)
        .single();

    if (quoteError || !quote) {
        return { error: "Presupuesto no encontrado" };
    }

    if (quote.status !== "sent") {
        return { error: "Este presupuesto no está pendiente de aprobación" };
    }

    // Update quote status to rejected
    const { error: updateError } = await supabase
        .from("quotes")
        .update({
            status: "rejected",
            rejection_reason: reason,
            rejected_at: new Date().toISOString(),
        })
        .eq("id", quoteId);

    if (updateError) {
        console.error("Error updating quote:", updateError);
        return { error: "Error al actualizar el presupuesto" };
    }

    // Create activity log
    await supabase.from("activity_logs").insert({
        organization_id: quote.organization_id,
        entity_type: "quote",
        entity_id: quoteId,
        action: "rejected",
        actor_id: user.id,
        actor_type: "client_representative",
        description: `Presupuesto "${quote.name}" rechazado`,
        metadata: {
            rejection_reason: reason,
        },
    });

    // TODO: Send notification to organization admins

    return { success: true, error: null };
}


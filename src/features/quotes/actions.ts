"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserOrganizations } from "@/features/organization/queries";

// ============================================
// CREATE QUOTE
// ============================================
export async function createQuote(formData: FormData) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa", data: null };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const client_id = formData.get("client_id") as string | null;
    const project_id = formData.get("project_id") as string | null;
    const quote_type = formData.get("quote_type") as string || "quote";
    const version = parseInt(formData.get("version") as string) || 1;
    const currency_id = formData.get("currency_id") as string;
    const exchange_rate = parseFloat(formData.get("exchange_rate") as string) || 1;
    const tax_pct = parseFloat(formData.get("tax_pct") as string) || 0;
    const tax_label = formData.get("tax_label") as string || "IVA";
    const discount_pct = parseFloat(formData.get("discount_pct") as string) || 0;
    const quote_date = formData.get("quote_date") as string | null;
    const valid_until = formData.get("valid_until") as string | null;
    const status = formData.get("status") as string || "draft";

    if (!name?.trim()) {
        return { error: "El nombre es requerido", data: null };
    }

    if (!currency_id) {
        return { error: "La moneda es requerida", data: null };
    }

    const { data, error } = await supabase
        .from("quotes")
        .insert({
            name: name.trim(),
            description: description?.trim() || null,
            organization_id: activeOrgId,
            project_id: project_id || null,
            client_id: client_id || null,
            quote_type,
            version,
            currency_id,
            exchange_rate,
            tax_pct,
            tax_label,
            discount_pct,
            quote_date: quote_date || null,
            valid_until: valid_until || null,
            status,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating quote:", error);
        return { error: error.message, data: null };
    }

    revalidatePath("/organization/quotes");
    return { data, error: null };
}

// ============================================
// UPDATE QUOTE
// ============================================
export async function updateQuote(formData: FormData) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa", data: null };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const client_id = formData.get("client_id") as string | null;
    const project_id = formData.get("project_id") as string | null;
    const quote_type = formData.get("quote_type") as string;
    const version = parseInt(formData.get("version") as string);
    const currency_id = formData.get("currency_id") as string;
    const exchange_rate = parseFloat(formData.get("exchange_rate") as string) || 1;
    const tax_pct = parseFloat(formData.get("tax_pct") as string) || 0;
    const tax_label = formData.get("tax_label") as string;
    const discount_pct = parseFloat(formData.get("discount_pct") as string) || 0;
    const quote_date = formData.get("quote_date") as string | null;
    const valid_until = formData.get("valid_until") as string | null;
    const status = formData.get("status") as string;

    if (!id) {
        return { error: "ID de presupuesto no proporcionado", data: null };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido", data: null };
    }

    const { data, error } = await supabase
        .from("quotes")
        .update({
            name: name.trim(),
            description: description?.trim() || null,
            project_id: project_id || null,
            client_id: client_id || null,
            quote_type,
            version,
            currency_id,
            exchange_rate,
            tax_pct,
            tax_label,
            discount_pct,
            quote_date: quote_date || null,
            valid_until: valid_until || null,
            status,
        })
        .eq("id", id)
        .eq("organization_id", activeOrgId)
        .select()
        .single();

    if (error) {
        console.error("Error updating quote:", error);
        return { error: error.message, data: null };
    }

    revalidatePath("/organization/quotes");
    return { data, error: null };
}

// ============================================
// DELETE QUOTE (soft delete)
// ============================================
export async function deleteQuote(id: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa" };
    }

    const { error } = await supabase
        .from("quotes")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", activeOrgId);

    if (error) {
        console.error("Error deleting quote:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/quotes");
    return { success: true, error: null };
}

// ============================================
// UPDATE QUOTE STATUS
// ============================================
export async function updateQuoteStatus(id: string, status: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa" };
    }

    const updateData: any = { status };

    // If approving, set approved_at
    if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        // TODO: Set approved_by when we have user context
    }

    const { error } = await supabase
        .from("quotes")
        .update(updateData)
        .eq("id", id)
        .eq("organization_id", activeOrgId);

    if (error) {
        console.error("Error updating quote status:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/quotes");
    return { success: true, error: null };
}

// ============================================
// DUPLICATE QUOTE
// ============================================
export async function duplicateQuote(id: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa", data: null };
    }

    // Get original quote
    const { data: original, error: fetchError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", id)
        .eq("organization_id", activeOrgId)
        .single();

    if (fetchError || !original) {
        return { error: "No se encontró el presupuesto", data: null };
    }

    // Create copy with incremented version
    const { data: newQuote, error: createError } = await supabase
        .from("quotes")
        .insert({
            ...original,
            id: undefined, // Let DB generate new ID
            name: `${original.name} (copia)`,
            version: original.version + 1,
            status: 'draft',
            approved_at: null,
            approved_by: null,
            created_at: undefined,
            updated_at: undefined,
        })
        .select()
        .single();

    if (createError) {
        console.error("Error duplicating quote:", createError);
        return { error: createError.message, data: null };
    }

    // TODO: Also duplicate quote_items

    revalidatePath("/organization/quotes");
    return { data: newQuote, error: null };
}

// ============================================
// CREATE QUOTE ITEM
// ============================================
export async function createQuoteItem(formData: FormData) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa", data: null };
    }

    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Usuario no autenticado", data: null };
    }

    const quote_id = formData.get("quote_id") as string;
    const organization_id = formData.get("organization_id") as string;
    const project_id = formData.get("project_id") as string | null;
    const currency_id = formData.get("currency_id") as string;
    const task_id = formData.get("task_id") as string | null;
    const description = formData.get("description") as string | null;
    const quantity = parseFloat(formData.get("quantity") as string) || 1;
    const unit_price = parseFloat(formData.get("unit_price") as string) || 0;
    const markup_pct = parseFloat(formData.get("markup_pct") as string) || 0;
    const tax_pct = parseFloat(formData.get("tax_pct") as string) || 0;
    const cost_scope = formData.get("cost_scope") as string || "materials_and_labor";

    if (!quote_id) {
        return { error: "ID de presupuesto no proporcionado", data: null };
    }

    const { data, error } = await supabase
        .from("quote_items")
        .insert({
            quote_id,
            organization_id: organization_id || activeOrgId,
            project_id: project_id || null,
            currency_id,
            task_id: task_id || null,
            description: description?.trim() || null,
            quantity,
            unit_price,
            markup_pct,
            tax_pct,
            cost_scope,
            created_by: user.id,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating quote item:", error);
        return { error: error.message, data: null };
    }

    revalidatePath(`/organization/quotes/${quote_id}`);
    return { data, error: null };
}

// ============================================
// DELETE QUOTE ITEM
// ============================================
export async function deleteQuoteItem(id: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa" };
    }

    const { error } = await supabase
        .from("quote_items")
        .delete()
        .eq("id", id)
        .eq("organization_id", activeOrgId);

    if (error) {
        console.error("Error deleting quote item:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/quotes");
    return { success: true, error: null };
}

// ============================================
// CONVERT QUOTE TO PROJECT
// Creates a new project from a standalone quote
// ============================================
export async function convertQuoteToProject(quoteId: string, projectName?: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa", data: null };
    }

    // Get the quote
    const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", quoteId)
        .eq("organization_id", activeOrgId)
        .single();

    if (quoteError || !quote) {
        return { error: "No se encontró el presupuesto", data: null };
    }

    // Validate: must be standalone quote (no project_id) and type 'quote'
    if (quote.project_id) {
        return { error: "Este presupuesto ya está vinculado a un proyecto", data: null };
    }

    if (quote.quote_type !== 'quote') {
        return { error: "Solo se pueden convertir cotizaciones (pre-venta) a proyectos", data: null };
    }

    // Create new project (only required fields)
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
            name: projectName || quote.name,
            organization_id: activeOrgId,
            status: 'active',
        })
        .select()
        .single();

    if (projectError || !project) {
        console.error("Error creating project:", projectError);
        return { error: projectError?.message || "Error al crear el proyecto", data: null };
    }

    // Create project_data with description if exists
    if (quote.description) {
        await supabase
            .from("project_data")
            .insert({
                project_id: project.id,
                organization_id: activeOrgId,
                description: quote.description,
            });
    }

    // Update quote: link to project and change type to 'contract'
    const { error: updateError } = await supabase
        .from("quotes")
        .update({
            project_id: project.id,
            quote_type: 'contract',
            status: 'approved',
            approved_at: new Date().toISOString(),
        })
        .eq("id", quoteId);

    if (updateError) {
        console.error("Error updating quote:", updateError);
        return { error: updateError.message, data: null };
    }

    // Also update quote_items to link to project
    await supabase
        .from("quote_items")
        .update({ project_id: project.id })
        .eq("quote_id", quoteId);

    // If quote has a client (contact), create project_client entry
    if (quote.client_id) {
        await supabase
            .from("project_clients")
            .insert({
                project_id: project.id,
                contact_id: quote.client_id,
                organization_id: activeOrgId,
                is_primary: true,
                status: 'active',
            });
    }

    revalidatePath("/organization/quotes");
    revalidatePath("/organization/projects");

    return { data: { project, quote: { ...quote, project_id: project.id } }, error: null };
}

// ============================================
// GENERATE COMMITMENTS FROM QUOTE
// Creates client commitments based on quote total
// ============================================
export async function generateCommitmentsFromQuote(
    quoteId: string,
    options: {
        clientId: string;
        numberOfPayments: number;
        advancePercentage?: number; // e.g., 30 for 30% advance
        concept?: string;
    }
) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa", data: null };
    }

    // Get quote with totals from view
    const { data: quote, error: quoteError } = await supabase
        .from("quotes_view")
        .select("*")
        .eq("id", quoteId)
        .eq("organization_id", activeOrgId)
        .single();

    if (quoteError || !quote) {
        return { error: "No se encontró el presupuesto", data: null };
    }

    if (!quote.project_id) {
        return { error: "El presupuesto debe estar vinculado a un proyecto para generar compromisos", data: null };
    }

    // Get project_client (we need the project_client ID, not contact ID)
    const { data: projectClient, error: pcError } = await supabase
        .from("project_clients")
        .select("id")
        .eq("project_id", quote.project_id)
        .eq("contact_id", options.clientId)
        .single();

    if (pcError || !projectClient) {
        // Try to create project_client if doesn't exist
        const { data: newPc, error: newPcError } = await supabase
            .from("project_clients")
            .insert({
                project_id: quote.project_id,
                contact_id: options.clientId,
                organization_id: activeOrgId,
            })
            .select("id")
            .single();

        if (newPcError || !newPc) {
            return { error: "Error al vincular cliente al proyecto", data: null };
        }
    }

    const projectClientId = projectClient?.id;

    const totalAmount = quote.total_with_tax || 0;
    const advancePct = options.advancePercentage || 0;
    const numberOfPayments = options.numberOfPayments || 1;

    const commitments: any[] = [];

    if (advancePct > 0) {
        // Create advance payment
        const advanceAmount = totalAmount * (advancePct / 100);
        commitments.push({
            project_id: quote.project_id,
            client_id: projectClientId,
            organization_id: activeOrgId,
            amount: advanceAmount,
            currency_id: quote.currency_id,
            exchange_rate: quote.exchange_rate || 1,
            commitment_method: 'fixed',
            concept: `Anticipo (${advancePct}%) - ${quote.name}`,
            quote_id: quoteId,
        });
    }

    // Remaining amount split into payments
    const remainingAmount = totalAmount - (totalAmount * (advancePct / 100));
    const paymentAmount = remainingAmount / numberOfPayments;

    for (let i = 0; i < numberOfPayments; i++) {
        commitments.push({
            project_id: quote.project_id,
            client_id: projectClientId,
            organization_id: activeOrgId,
            amount: paymentAmount,
            currency_id: quote.currency_id,
            exchange_rate: quote.exchange_rate || 1,
            commitment_method: 'fixed',
            concept: numberOfPayments === 1
                ? `${options.concept || quote.name}`
                : `Cuota ${i + 1}/${numberOfPayments} - ${options.concept || quote.name}`,
            quote_id: quoteId,
        });
    }

    // Insert all commitments
    const { data, error } = await supabase
        .from("client_commitments")
        .insert(commitments)
        .select();

    if (error) {
        console.error("Error creating commitments:", error);
        return { error: error.message, data: null };
    }

    revalidatePath(`/project/${quote.project_id}/clients`);
    revalidatePath(`/organization/quotes/${quoteId}`);

    return { data, error: null };
}

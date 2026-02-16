"use server";


import { sanitizeError } from "@/lib/error-utils";
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
        return { error: sanitizeError(error), data: null };
    }

    revalidatePath("/organization/quotes");
    return { data, error: null };
}

// ============================================
// CREATE CHANGE ORDER
// Creates a change order linked to a parent contract
// ============================================
export async function createChangeOrder(
    contractId: string,
    data: {
        name?: string;
        description?: string;
    }
) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa", data: null };
    }

    // 1. Get the parent contract
    const { data: contract, error: contractError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", contractId)
        .eq("organization_id", activeOrgId)
        .eq("is_deleted", false)
        .single();

    if (contractError || !contract) {
        return { error: "Contrato no encontrado", data: null };
    }

    // 2. Validate it's a contract (not a quote or another change_order)
    if (contract.quote_type !== 'contract') {
        return { error: "Solo se pueden crear adicionales de contratos", data: null };
    }

    // 3. Get next change order number
    const { data: lastCO } = await supabase
        .from("quotes")
        .select("change_order_number")
        .eq("parent_quote_id", contractId)
        .eq("quote_type", "change_order")
        .eq("is_deleted", false)
        .order("change_order_number", { ascending: false })
        .limit(1);

    const nextNumber = (lastCO?.[0]?.change_order_number || 0) + 1;

    // 4. Generate default name if not provided
    const coName = data.name || `CO #${nextNumber}: Adicional`;

    // 5. Create the change order, inheriting from parent contract
    const { data: changeOrder, error } = await supabase
        .from("quotes")
        .insert({
            name: coName,
            description: data.description || null,
            organization_id: activeOrgId,
            project_id: contract.project_id,       // Inherit from parent
            client_id: contract.client_id,         // Inherit from parent
            currency_id: contract.currency_id,     // Inherit from parent
            exchange_rate: contract.exchange_rate, // Inherit from parent
            quote_type: 'change_order',
            parent_quote_id: contractId,           // Link to parent!
            change_order_number: nextNumber,
            status: 'draft',
            tax_pct: contract.tax_pct,             // Inherit tax settings
            tax_label: contract.tax_label,
            discount_pct: 0,                       // COs typically don't have global discount
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating change order:", error);
        return { error: sanitizeError(error), data: null };
    }

    revalidatePath("/organization/quotes");
    revalidatePath(`/organization/quotes/${contractId}`);
    if (contract.project_id) {
        revalidatePath('/organization/quotes', 'page');
    }

    return { data: changeOrder, error: null };
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
        return { error: sanitizeError(error), data: null };
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
        return { error: sanitizeError(error) };
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
        return { error: sanitizeError(error) };
    }

    revalidatePath("/organization/quotes");
    return { success: true, error: null };
}

// ============================================
// APPROVE QUOTE AND CREATE CONSTRUCTION TASKS
// ============================================
// Uses a database function to atomically:
// 1. Validate quote is not already approved
// 2. Create construction_tasks from quote_items
// 3. Mark quote as approved
// 4. For contracts: freeze original_contract_value
// ============================================
export async function approveQuote(quoteId: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return {
            success: false,
            error: "No hay organización activa"
        };
    }

    // Verify quote belongs to this org before calling function
    // Also get quote_type to check if we need to freeze original_contract_value
    const { data: quote, error: fetchError } = await supabase
        .from("quotes_view") // Use view to get total_with_tax
        .select("id, project_id, status, quote_type, total_with_tax, original_contract_value")
        .eq("id", quoteId)
        .eq("organization_id", activeOrgId)
        .eq("is_deleted", false)
        .single();

    if (fetchError || !quote) {
        return {
            success: false,
            error: "Presupuesto no encontrado"
        };
    }

    // Call the atomic database function
    const { data, error } = await supabase.rpc(
        'approve_quote_and_create_tasks',
        {
            p_quote_id: quoteId,
            p_member_id: null
        }
    );

    if (error) {
        console.error("Error approving quote:", error);
        return {
            success: false,
            error: sanitizeError(error)
        };
    }

    // Parse response from function
    const result = data as {
        success: boolean;
        error?: string;
        message?: string;
        tasks_created?: number;
        approved_at?: string;
    };

    if (!result.success) {
        return {
            success: false,
            error: result.message || result.error || "Error desconocido"
        };
    }

    // CHANGE ORDERS ARCHITECTURE:
    // If this is a CONTRACT and original_contract_value is not set, freeze it now
    if (quote.quote_type === 'contract' && !quote.original_contract_value) {
        const { error: freezeError } = await supabase
            .from("quotes")
            .update({
                original_contract_value: quote.total_with_tax || 0
            })
            .eq("id", quoteId);

        if (freezeError) {
            console.error("Error freezing original_contract_value:", freezeError);
            // Non-blocking: we log but don't fail the approval
        }
    }

    // Revalidate paths
    revalidatePath("/organization/quotes");
    revalidatePath(`/organization/quotes/${quoteId}`);
    if (quote.project_id) {
        revalidatePath('/organization/quotes', 'page');
        revalidatePath(`/project/${quote.project_id}/construction-tasks`);
    }

    return {
        success: true,
        tasksCreated: result.tasks_created || 0,
        approvedAt: result.approved_at,
        originalContractValue: quote.quote_type === 'contract' ? (quote.original_contract_value || quote.total_with_tax) : null
    };
}

// ============================================
// DUPLICATE QUOTE
// Also duplicates all quote_items
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

    // Create copy with unique name (add timestamp to avoid constraint violations)
    const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const { id: _originalId, created_at: _createdAt, updated_at: _updatedAt, approved_at: _approvedAt, approved_by: _approvedBy, ...quoteData } = original;

    const { data: newQuote, error: createError } = await supabase
        .from("quotes")
        .insert({
            ...quoteData,
            name: `${original.name} (copia ${timestamp})`,
            version: original.version + 1,
            status: 'draft',
        })
        .select()
        .single();

    if (createError) {
        console.error("Error duplicating quote:", createError);
        return { error: sanitizeError(createError), data: null };
    }

    // Duplicate quote_items
    const { data: originalItems, error: itemsFetchError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .is("deleted_at", null);

    if (itemsFetchError) {
        console.error("Error fetching quote items:", itemsFetchError);
        // Quote was created but items couldn't be copied - partial success
    } else if (originalItems && originalItems.length > 0) {
        // Map items to new quote ID, excluding id and timestamps using destructuring
        const newItems = originalItems.map(item => {
            // Destructure to exclude id, created_at, updated_at, deleted_at
            const { id: _id, created_at, updated_at, deleted_at, ...rest } = item;
            return {
                ...rest,
                quote_id: newQuote.id,
            };
        });

        const { error: itemsInsertError } = await supabase
            .from("quote_items")
            .insert(newItems);

        if (itemsInsertError) {
            console.error("Error duplicating quote items:", itemsInsertError);
            // Quote was created but items couldn't be copied - partial success
        }
    }

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

    // NOTE: created_by is auto-populated by DB trigger handle_updated_by()
    // See: AUDIT-LOGGING-GUIDELINES.md

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
            // created_by is auto-populated by DB trigger
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating quote item:", error);
        return { error: sanitizeError(error), data: null };
    }

    revalidatePath(`/organization/quotes/${quote_id}`);
    return { data, error: null };
}

// ============================================
// UPDATE QUOTE ITEM
// ============================================
export async function updateQuoteItem(id: string, formData: FormData) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa", data: null };
    }

    const task_id = formData.get("task_id") as string | null;
    const description = formData.get("description") as string | null;
    const quantity = parseFloat(formData.get("quantity") as string) || 1;
    const unit_price = parseFloat(formData.get("unit_price") as string) || 0;
    const markup_pct = parseFloat(formData.get("markup_pct") as string) || 0;
    const tax_pct = parseFloat(formData.get("tax_pct") as string) || 0;
    const cost_scope = formData.get("cost_scope") as string || "materials_and_labor";

    const { data, error } = await supabase
        .from("quote_items")
        .update({
            task_id: task_id || null,
            description: description?.trim() || null,
            quantity,
            unit_price,
            markup_pct,
            tax_pct,
            cost_scope,
        })
        .eq("id", id)
        .eq("organization_id", activeOrgId)
        .select()
        .single();

    if (error) {
        console.error("Error updating quote item:", error);
        return { error: sanitizeError(error), data: null };
    }

    // Revalidate both list and detail pages (org and project level)
    revalidatePath("/organization/quotes");
    if (data?.quote_id) {
        revalidatePath(`/organization/quotes/${data.quote_id}`);
    }
    return { data, error: null };
}

// ============================================
// DELETE QUOTE ITEM (Soft Delete)
// ============================================
export async function deleteQuoteItem(id: string, quoteId?: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa" };
    }

    const { error } = await supabase
        .from("quote_items")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("organization_id", activeOrgId);

    if (error) {
        console.error("Error deleting quote item:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/organization/quotes");
    if (quoteId) {
        revalidatePath(`/organization/quotes/${quoteId}`);
    }
    return { success: true, error: null };
}

// ============================================
// CONVERT QUOTE TO CONTRACT
// Promotes an approved quote (within a project) to a Contract
// ============================================
export async function convertQuoteToContract(quoteId: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa" };
    }

    // 1. Get quote details (using view for totals)
    const { data: quote, error: fetchError } = await supabase
        .from("quotes_view")
        .select("id, status, quote_type, project_id, total_with_tax")
        .eq("id", quoteId)
        .eq("organization_id", activeOrgId)
        .single();

    if (fetchError || !quote) {
        return { error: "Presupuesto no encontrado" };
    }

    // 2. Validations
    if (quote.quote_type !== 'quote') {
        return { error: "Solo se pueden convertir cotizaciones" };
    }

    if (quote.status !== 'approved') {
        return { error: "La cotización debe estar aprobada para convertirse en contrato" };
    }

    if (!quote.project_id) {
        return { error: "La cotización debe estar vinculada a un proyecto" };
    }

    // 3. Update to contract and freeze value
    const { error: updateError } = await supabase
        .from("quotes")
        .update({
            quote_type: 'contract',
            original_contract_value: quote.total_with_tax || 0,
            updated_at: new Date().toISOString()
        })
        .eq("id", quoteId);

    if (updateError) {
        console.error("Error converting to contract:", updateError);
        return { error: sanitizeError(updateError) };
    }

    revalidatePath("/organization/quotes");
    revalidatePath(`/organization/quotes/${quoteId}`);
    revalidatePath('/organization/quotes', 'page');

    return { success: true };
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
        return { error: sanitizeError(projectError) || "Error al crear el proyecto", data: null };
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
        return { error: sanitizeError(updateError), data: null };
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
        return { error: sanitizeError(error), data: null };
    }

    revalidatePath('/organization/quotes', 'page');
    revalidatePath(`/organization/quotes/${quoteId}`);

    return { data, error: null };
}


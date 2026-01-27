import { createClient } from "@/lib/supabase/server";

export async function getSubcontractsByProject(projectId: string) {
    const supabase = await createClient();

    // We fetch subcontracts from the view which already includes provider details and calculated financials
    const { data, error } = await supabase
        .from('subcontracts_view')
        .select('*')
        .eq('project_id', projectId)
        .order('title', { ascending: true });

    if (error) {
        console.error('Error fetching subcontracts details:', JSON.stringify(error, null, 2));
        return [];
    }

    return data;
}

export async function getSubcontractById(subcontractId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('subcontracts')
        .select(`
            *,
            title,
            contact:contacts(
                id,
                full_name,
                company_name,
                image_url,
                email,
                phone,
                first_name,
                last_name
            ),
            currency:currencies(
                id,
                code,
                symbol,
                name
            )
        `)
        .eq('id', subcontractId)
        .single();

    if (error) {
        console.error('Error fetching subcontract:', error);
        return null;
    }

    return data;
}

export async function getSubcontractPayments(projectId: string) {
    const supabase = await createClient();

    // Use the view which already includes all denormalized data
    const { data, error } = await supabase
        .from('subcontract_payments_view')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching subcontract payments:', JSON.stringify(error, null, 2));
        return [];
    }

    return data;
}

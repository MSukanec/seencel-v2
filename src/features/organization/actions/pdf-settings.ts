"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { optimizeImage } from "@/lib/image-optimizer";

// Type matching the Frontend Component state AND DB Schema
export type PdfGlobalTheme = {
    id?: string;
    name: string;

    // Page
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';

    // Margins
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;

    // Brand / Appearance
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string; // New

    // Header / Logo
    logoWidth: number; // New
    logoHeight: number; // New
    companyNameSize: number; // New
    companyNameColor: string; // New

    // Typography Sizes
    titleSize: number; // New
    subtitleSize: number; // New
    bodySize: number; // New
    companyInfoSize: number; // New

    // Footer
    showFooter: boolean;
    footerText: string;
    showPageNumbers: boolean;

    // Header visibility options
    showCompanyName: boolean;
    showCompanyAddress: boolean;

    // PDF-specific logo (per template)
    pdfLogoPath?: string;
};

async function getActiveOrganizationId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
        .from('users')
        .select(`id, user_preferences!inner(last_organization_id)`)
        .eq('auth_id', user.id)
        .single();

    if (!userData) return null;

    const pref = Array.isArray((userData as any).user_preferences)
        ? (userData as any).user_preferences[0]
        : (userData as any).user_preferences;

    return pref?.last_organization_id || null;
}

export async function getOrganizationPdfTheme(specificTemplateId?: string): Promise<{
    data?: PdfGlobalTheme,
    isPro?: boolean,
    isGlobal?: boolean,
    canCreateCustomTemplates?: boolean,
    logoUrl?: string | null,
    pdfLogoUrl?: string | null,
    availableTemplates?: { id: string, name: string }[],
    demoData?: { companyName?: string, address?: string, city?: string, state?: string, country?: string, phone?: string, email?: string },
    error?: string
}> {
    const supabase = await createClient();
    const orgId = await getActiveOrganizationId();

    if (!orgId) return { error: "Organization not found" };

    const [orgRes, prefRes, templatesRes, orgDataRes] = await Promise.all([
        supabase.from('organizations')
            .select(`
                name,
                plan_id,
                logo_url
            `)
            .eq('id', orgId)
            .single(),
        supabase.from('organization_preferences')
            .select('default_pdf_template_id')
            .eq('organization_id', orgId)
            .single(),
        supabase.from('pdf_templates')
            .select('id, name')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false }),
        supabase.from('organization_data')
            .select('address, city, state, country, phone, email')
            .eq('organization_id', orgId)
            .single()
    ]);

    // Fetch plan from billing schema separately (cross-schema FK can't be embedded)
    let planSlug = 'free';
    let planFeatures: Record<string, unknown> = {};
    if (orgRes.data?.plan_id) {
        const { data: planData } = await supabase
            .schema('billing').from('plans')
            .select('slug, features')
            .eq('id', orgRes.data.plan_id)
            .single();
        planSlug = planData?.slug?.toLowerCase() || 'free';
        planFeatures = (planData?.features as Record<string, unknown>) || {};
    }

    const isPro = !planSlug.includes('free') && !planSlug.includes('basic');
    const canCreateCustomTemplates = planFeatures.custom_pdf_templates === true;

    const logoUrl = orgRes.data?.logo_url || null;

    // Prepare Demo Data — always include companyName from org
    const demoData = {
        companyName: orgRes.data?.name || "Mi Empresa",
        address: orgDataRes.data?.address,
        city: orgDataRes.data?.city,
        state: orgDataRes.data?.state,
        country: orgDataRes.data?.country,
        phone: orgDataRes.data?.phone,
        email: orgDataRes.data?.email
    };

    let targetId: string | undefined | null;

    // Logic to determine which template to load
    if (specificTemplateId === 'GLOBAL_DEFAULT') {
        // Explicitly requesting global default (ignoring preference)
        targetId = null;
    } else if (specificTemplateId) {
        // Explicitly requesting a specific template
        targetId = specificTemplateId;
    } else {
        // Default behavior: Load preference, or fall back to global
        targetId = prefRes.data?.default_pdf_template_id;
    }

    let template;

    if (targetId) {
        // Try fetch specific ID
        const { data } = await supabase.from('pdf_templates').select('*').eq('id', targetId).single();
        if (data && (data.organization_id === orgId || data.organization_id === null)) {
            template = data;
        }
    }

    // Fallback if no targetId found OR if targetId didn't return a valid template
    if (!template) {
        const { data } = await supabase
            .from('pdf_templates')
            .select('*')
            .is('organization_id', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
        template = data;
    }

    if (!template) {
        return { error: "No PDF template found.", isPro };
    }

    // MAP DB -> FRONTEND
    const theme: PdfGlobalTheme = {
        id: template.id,
        name: template.name || (template.organization_id ? "Plantilla Personalizada" : "Plantilla Predeterminada"),

        pageSize: (template.page_size as any) || 'A4',
        orientation: (template.page_orientation as any) || 'portrait',

        marginTop: template.margin_top ?? 20,
        marginBottom: template.margin_bottom ?? 20,
        marginLeft: template.margin_left ?? 20,
        marginRight: template.margin_right ?? 20,

        fontFamily: template.font_family || 'Inter',
        primaryColor: template.primary_color || '#000000',
        secondaryColor: template.secondary_color || '#e5e5e5',
        textColor: template.text_color || '#1f2937',

        logoWidth: template.logo_width ?? 80,
        logoHeight: template.logo_height ?? 60,
        companyNameSize: template.company_name_size ?? 24,
        companyNameColor: template.company_name_color || '#1f2937',

        titleSize: template.title_size ?? 18,
        subtitleSize: template.subtitle_size ?? 14,
        bodySize: template.body_size ?? 12,
        companyInfoSize: template.company_info_size ?? 10,

        showFooter: (template.show_footer_info ?? true),
        footerText: template.footer_text ?? "",
        showPageNumbers: template.footer_show_page_numbers ?? true,
        showCompanyName: template.show_company_name ?? true,
        showCompanyAddress: template.show_company_address ?? true,
        pdfLogoPath: template.pdf_logo_path || undefined,
    };

    // Build PDF logo URL if available
    const pdfLogoUrl = template.pdf_logo_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${template.pdf_logo_path}`
        : null;

    return {
        data: theme,
        isPro,
        isGlobal: !template.organization_id,
        canCreateCustomTemplates,
        logoUrl,
        pdfLogoUrl, // NEW: PDF-specific logo
        availableTemplates: templatesRes.data || [],
        demoData // Return the fetched demo data
    };
}

export async function createOrganizationPdfTemplate(name: string): Promise<{ success: boolean, newTemplateId?: string, error?: string }> {
    const supabase = await createClient();
    const orgId = await getActiveOrganizationId();
    if (!orgId) return { success: false, error: "Authentication failed" };

    // Simplified Payload: Rely on DB Defaults (Page size A4, etc)
    const payload = {
        organization_id: orgId,
        name: name
    };

    const { data, error } = await supabase
        .from('pdf_templates')
        .insert(payload)
        .select('id')
        .single();

    if (error || !data) {
        console.error("Create template error:", error);
        return { success: false, error: "Could not create template" };
    }

    await supabase.from('organization_preferences').update({ default_pdf_template_id: data.id }).eq('organization_id', orgId);

    revalidatePath('/organization/settings');
    return { success: true, newTemplateId: data.id };
}

export async function updateOrganizationPdfTheme(theme: PdfGlobalTheme): Promise<{ success: boolean, error?: string }> {
    const supabase = await createClient();
    const orgId = await getActiveOrganizationId();

    if (!orgId) return { success: false, error: "Organization not found" };
    if (!theme.id) return { success: false, error: "No template ID provided." };

    const { data: currentT } = await supabase.from('pdf_templates').select('organization_id').eq('id', theme.id).single();

    if (!currentT) return { success: false, error: "Template not found" };
    if (currentT.organization_id !== orgId) {
        return { success: false, error: "Cannot modify a global read-only template." };
    }

    // MAP FRONTEND -> DB
    const payload = {
        page_size: theme.pageSize,
        page_orientation: theme.orientation,
        margin_top: theme.marginTop,
        margin_bottom: theme.marginBottom,
        margin_left: theme.marginLeft,
        margin_right: theme.marginRight,
        font_family: theme.fontFamily,
        primary_color: theme.primaryColor,
        secondary_color: theme.secondaryColor,
        text_color: theme.textColor,
        logo_width: theme.logoWidth,
        logo_height: theme.logoHeight,
        company_name_size: theme.companyNameSize,
        company_name_color: theme.companyNameColor,
        title_size: theme.titleSize,
        subtitle_size: theme.subtitleSize,
        body_size: theme.bodySize,
        company_info_size: theme.companyInfoSize,
        footer_text: theme.footerText,
        footer_show_page_numbers: theme.showPageNumbers,
        show_footer_info: theme.showFooter,
        show_company_name: theme.showCompanyName,
        show_company_address: theme.showCompanyAddress,
        updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
        .from('pdf_templates')
        .update(payload)
        .eq('id', theme.id);

    if (updateError) {
        return { success: false, error: "Database update failed." };
    }

    revalidatePath('/organization/details');
    return { success: true };
}

export async function deleteOrganizationPdfTemplate(templateId: string): Promise<{ success: boolean, error?: string }> {
    const supabase = await createClient();
    const orgId = await getActiveOrganizationId();

    if (!orgId) return { success: false, error: "Organization not found" };

    const { data: currentT } = await supabase.from('pdf_templates').select('organization_id').eq('id', templateId).single();

    if (!currentT || currentT.organization_id !== orgId) {
        return { success: false, error: "Cannot delete this template." };
    }

    const { data: pref } = await supabase.from('organization_preferences').select('default_pdf_template_id').eq('organization_id', orgId).single();

    if (pref?.default_pdf_template_id === templateId) {
        await supabase.from('organization_preferences').update({ default_pdf_template_id: null }).eq('organization_id', orgId);
    }

    const { error } = await supabase.from('pdf_templates').delete().eq('id', templateId);

    if (error) {
        return { success: false, error: "Failed to delete template." };
    }

    revalidatePath('/organization/details');
    return { success: true };
}

/**
 * Upload a PDF-specific logo for a template
 * Optimized for print: preserves transparency, allows PNG format
 */
export async function uploadPdfLogo(formData: FormData): Promise<{
    success: boolean;
    pdfLogoUrl?: string;
    error?: string;
}> {
    const supabase = await createClient();
    const orgId = await getActiveOrganizationId();

    if (!orgId) return { success: false, error: "Organization not found" };

    const file = formData.get("file") as File;
    const templateId = formData.get("templateId") as string;

    if (!file || !templateId) {
        return { success: false, error: "Missing file or template ID" };
    }

    // Verify template ownership
    const { data: template } = await supabase
        .from('pdf_templates')
        .select('organization_id')
        .eq('id', templateId)
        .single();

    if (!template || template.organization_id !== orgId) {
        return { success: false, error: "Cannot modify this template" };
    }

    try {
        // Optimize Image - PNG format to preserve transparency
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { buffer: optimizedBuffer, mimeType, extension } = await optimizeImage(buffer, {
            maxWidth: 800, // Larger for print quality
            quality: 90,
            format: 'png' // Preserve transparency
        });

        // Upload to 'public-assets' bucket under pdf-logos folder
        const fileName = `pdf-logo-${templateId}-${Date.now()}.${extension}`;
        const filePath = `pdf-logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(filePath, optimizedBuffer, {
                contentType: mimeType,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // Update template record with pdf_logo_path
        const { error: updateError } = await supabase
            .from('pdf_templates')
            .update({ pdf_logo_path: filePath })
            .eq('id', templateId);

        if (updateError) throw updateError;

        // Return success with URL
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${filePath}`;

        revalidatePath('/organization/settings');
        return { success: true, pdfLogoUrl: publicUrl };

    } catch (error: any) {
        console.error("Upload PDF Logo Error:", error);
        return { success: false, error: sanitizeError(error) };
    }
}

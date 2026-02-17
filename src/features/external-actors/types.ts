import { z } from "zod";

// ==========================================
// Actor Types
// ==========================================

export const EXTERNAL_ACTOR_TYPES = {
    CLIENT: "client",
    FIELD_WORKER: "field_worker",
    ACCOUNTANT: "accountant",
    EXTERNAL_SITE_MANAGER: "external_site_manager",
    SUBCONTRACTOR_PORTAL_USER: "subcontractor_portal_user",
} as const;

export type ExternalActorType = (typeof EXTERNAL_ACTOR_TYPES)[keyof typeof EXTERNAL_ACTOR_TYPES];

export const EXTERNAL_ACTOR_TYPE_LABELS: Record<ExternalActorType, string> = {
    client: "Cliente",
    field_worker: "Trabajador de campo",
    accountant: "Contador externo",
    external_site_manager: "Director de obra externo",
    subcontractor_portal_user: "Subcontratista (portal)",
};

// ==========================================
// Schemas
// ==========================================

export const organizationExternalActorSchema = z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    user_id: z.string().uuid(),
    actor_type: z.enum([
        "client",
        "field_worker",
        "accountant",
        "external_site_manager",
        "subcontractor_portal_user",
    ]),
    is_active: z.boolean().default(true),
    created_at: z.string(),
    updated_at: z.string(),
    created_by: z.string().uuid().nullable(),
    updated_by: z.string().uuid().nullable(),
    is_deleted: z.boolean().default(false),
    deleted_at: z.string().nullable(),
});

export type OrganizationExternalActor = z.infer<typeof organizationExternalActorSchema>;

// ==========================================
// Create / Update Schemas
// ==========================================

export const createExternalActorSchema = z.object({
    organization_id: z.string().uuid(),
    user_id: z.string().uuid(),
    actor_type: z.enum([
        "client",
        "field_worker",
        "accountant",
        "external_site_manager",
        "subcontractor_portal_user",
    ]),
    is_active: z.boolean().default(true),
});

export const updateExternalActorSchema = z.object({
    id: z.string().uuid(),
    actor_type: z.enum([
        "client",
        "field_worker",
        "accountant",
        "external_site_manager",
        "subcontractor_portal_user",
    ]).optional(),
    is_active: z.boolean().optional(),
});

export type CreateExternalActorInput = z.infer<typeof createExternalActorSchema>;
export type UpdateExternalActorInput = z.infer<typeof updateExternalActorSchema>;

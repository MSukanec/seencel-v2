/**
 * Import system types and constants
 * Separated from "use server" files to allow exports of non-functions
 */

export interface ImportBatch {
    id: string;
    organization_id: string;
    entity_type: string;
    record_count: number;
    status: 'pending' | 'completed' | 'reverted';
    created_at: string;
    member_id: string;
    // Joined fields from organization_members -> users
    user_full_name?: string;
    user_avatar_url?: string;
}

/**
 * Entity type labels for display
 */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
    'materials': 'Materiales',
    'material_payments': 'Pagos de Materiales',
    'contacts': 'Contactos',
    'client_payments': 'Pagos de Clientes',
    'subcontract_payments': 'Pagos de Subcontratos',
    'labor_payments': 'Pagos de Mano de Obra',
};

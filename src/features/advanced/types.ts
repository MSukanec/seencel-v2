// Types for the Economic Index system

export interface EconomicIndexType {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    periodicity: 'monthly' | 'quarterly' | 'annual';
    base_year: number | null;
    base_value: number | null;
    source: string | null;
    is_system: boolean;
    created_at: string;
    updated_at: string;
    // Joined data
    components?: EconomicIndexComponent[];
    values_count?: number;
    latest_value?: EconomicIndexValue;
}

export interface EconomicIndexComponent {
    id: string;
    index_type_id: string;
    key: string;
    name: string;
    is_main: boolean;
    sort_order: number;
    color: string | null;
    created_at: string;
}

export interface EconomicIndexValue {
    id: string;
    index_type_id: string;
    period_year: number;
    period_month: number | null;
    period_quarter: number | null;
    values: Record<string, number>; // JSONB: { "general": 1234.56, "materials": 1567.89 }
    source_url: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export type Periodicity = 'monthly' | 'quarterly' | 'annual';

export const PERIODICITY_LABELS: Record<Periodicity, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    annual: 'Anual',
};

export const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const QUARTER_NAMES = ["Q1", "Q2", "Q3", "Q4"];

// Default components for common indices
export const DEFAULT_ICC_COMPONENTS = [
    { key: 'general', name: 'Nivel General', is_main: true, sort_order: 0 },
    { key: 'materials', name: 'Materiales', is_main: false, sort_order: 1 },
    { key: 'labor', name: 'Mano de Obra', is_main: false, sort_order: 2 },
    { key: 'overhead', name: 'Gastos Generales', is_main: false, sort_order: 3 },
];

export const DEFAULT_CAC_COMPONENTS = [
    { key: 'general', name: 'Índice General', is_main: true, sort_order: 0 },
    { key: 'materials', name: 'Materiales', is_main: false, sort_order: 1 },
    { key: 'labor', name: 'Mano de Obra', is_main: false, sort_order: 2 },
];

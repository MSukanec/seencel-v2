/**
 * Tax label data for different countries/regions
 * Used for quotes, invoices, and organization defaults
 */

export interface TaxLabel {
    id: string;
    code: string;
    name: string;
    countryCodes: string[];
}

// Pre-defined tax labels for common regions
export const TAX_LABELS: TaxLabel[] = [
    // LATAM (IVA countries)
    {
        id: 'iva',
        code: 'IVA',
        name: 'IVA (Impuesto al Valor Agregado)',
        countryCodes: ['AR', 'MX', 'ES', 'CL', 'CO', 'PE', 'UY', 'PY', 'EC', 'VE', 'BO', 'PA']
    },
    // USA
    {
        id: 'sales_tax',
        code: 'Sales Tax',
        name: 'Sales Tax (USA)',
        countryCodes: ['US']
    },
    // UK/Commonwealth
    {
        id: 'vat',
        code: 'VAT',
        name: 'VAT (Value Added Tax)',
        countryCodes: ['GB', 'UK', 'IE', 'AU', 'NZ']
    },
    // Brazil (multiple taxes)
    {
        id: 'icms',
        code: 'ICMS',
        name: 'ICMS (Brasil)',
        countryCodes: ['BR']
    },
    // Canada
    {
        id: 'gst',
        code: 'GST',
        name: 'GST (Goods and Services Tax)',
        countryCodes: ['CA', 'AU', 'NZ', 'SG']
    },
    // Generic
    {
        id: 'tax',
        code: 'Tax',
        name: 'Tax (Generic)',
        countryCodes: []
    },
] as const;

/**
 * Get default tax label code based on country code
 */
export function getDefaultTaxLabelForCountry(countryCode: string): string {
    const upper = countryCode?.toUpperCase();
    const match = TAX_LABELS.find(t => t.countryCodes.includes(upper));
    return match?.code || 'IVA'; // Default to IVA
}

/**
 * Get all tax label options for Select component
 */
export function getTaxLabelOptions() {
    return TAX_LABELS.map(t => ({
        value: t.code,
        label: t.name,
    }));
}


import { HealthRule, HealthStatus } from "../types";

/**
 * Common Rule Factories
 * These functions generate specific rules for modules by configuring generic logic.
 */

// --- 1. NULL/EMPTY CHECKS ---

export const ruleRequired = (field: string, label: string): HealthRule => ({
    id: `req-${field}`,
    name: `Valor requerido: ${label}`,
    description: `El campo ${label} no puede estar vacío.`,
    weight: 1.0, // Critical
    evaluate: (entity: any) => {
        const val = entity[field];
        const isValid = val !== null && val !== undefined && val !== '';

        return {
            score: isValid ? 100 : 0,
            status: isValid ? 'excellent' : 'critical',
            trend: 'stable',
            currentValue: isValid ? 'Presente' : 'Faltante',
            message: isValid ? undefined : `Falta el campo ${label}.`,
            recommendation: isValid ? undefined : `Completa el campo ${label}.`
        };
    }
});

// --- 2. DATE LOGIC ---

export const ruleNoFutureDate = (field: string, label: string, toleranceDays = 1): HealthRule => ({
    id: `no-future-${field}`,
    name: `Fecha válida: ${label}`,
    description: `La fecha de ${label} no puede estar en el futuro.`,
    weight: 0.8,
    evaluate: (entity: any) => {
        const val = entity[field];
        if (!val) return { score: 100, status: 'unknown', trend: 'stable', currentValue: 'N/A' }; // Skip if empty (handled by required)

        const date = new Date(val);
        const now = new Date();
        // Add tolerance (e.g. timezones)
        now.setDate(now.getDate() + toleranceDays);

        const isFuture = date > now;

        return {
            score: isFuture ? 0 : 100,
            status: isFuture ? 'critical' : 'excellent',
            trend: 'stable',
            currentValue: date.toLocaleDateString(),
            message: isFuture ? `${label} está en el futuro.` : undefined,
            recommendation: isFuture ? 'Verifica que la fecha sea correcta.' : undefined
        };
    }
});

export const ruleRecentActivity = (field: string, label: string, daysThreshold = 30): HealthRule => ({
    id: `recent-${field}`,
    name: `Actividad reciente: ${label}`,
    description: `Verifica si ${label} es reciente (< ${daysThreshold} días).`,
    weight: 0.3, // Low impact usually
    evaluate: (entity: any) => {
        const val = entity[field];
        if (!val) return { score: 0, status: 'unknown', trend: 'stable', currentValue: 'N/A' };

        const date = new Date(val);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isRecent = diffDays <= daysThreshold;

        // Simple linear decay score? Or binary?
        const score = isRecent ? 100 : Math.max(0, 100 - (diffDays - daysThreshold));

        return {
            score,
            status: score > 80 ? 'good' : score > 50 ? 'fair' : 'poor',
            trend: 'deteriorating', // Time always passes
            currentValue: `${diffDays} días`,
            message: isRecent ? undefined : `${label} es antigua (${diffDays} días).`,
            recommendation: isRecent ? undefined : 'Considera actualizar o verificar.'
        };
    }
});

// --- 3. LOGICAL/BUSINESS ---

export const rulePositiveAmount = (field: string, label: string): HealthRule => ({
    id: `pos-${field}`,
    name: `Monto positivo: ${label}`,
    description: `${label} debe ser un valor positivo.`,
    weight: 0.9,
    evaluate: (entity: any) => {
        const val = Number(entity[field]);
        if (isNaN(val)) return { score: 0, status: 'critical', trend: 'stable', currentValue: 'NaN' };

        const isPositive = val >= 0;

        return {
            score: isPositive ? 100 : 0,
            status: isPositive ? 'excellent' : 'critical', // Negative payments are mostly errors unless 'refund'
            trend: 'stable',
            currentValue: val.toString(),
            message: isPositive ? undefined : `${label} es negativo.`,
            recommendation: isPositive ? undefined : 'Verifica si es un error o un reembolso.'
        };
    }
});

export const ruleExchangeRate = (field: string, label: string = 'Cotización', threshold = 1): HealthRule => ({
    id: `rate-${field}`,
    name: `Cotización válida: ${label}`,
    description: `Verifica que ${label} sea mayor a ${threshold} (para evitar paridad 1:1 errónea).`,
    weight: 1.0, // Critical
    evaluate: (entity: any) => {
        const val = entity[field];
        // If null/undefined, skip (ruleRequired should handle if mandatory).
        // If 0, it's < 1 so it fails.
        // If null/undefined, it's missing data where a rate is expected -> Critical
        if (val === null || val === undefined) return {
            score: 0,
            status: 'critical',
            trend: 'stable',
            currentValue: 'Faltante',
            message: `Falta la ${label}.`,
            recommendation: 'Debe cargar la cotización.'
        };

        const rate = Number(val);
        const isValid = rate > threshold; // Strict > 1 if threshold is 1.

        return {
            score: isValid ? 100 : 0,
            status: isValid ? 'excellent' : 'critical',
            trend: 'stable',
            currentValue: rate.toString(),
            message: isValid ? undefined : `${label} es ${rate} (posible error de carga).`,
            recommendation: isValid ? undefined : 'Verifica si olvidaste cargar la cotización.'
        };
    }
});


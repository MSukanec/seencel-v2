import { HealthExplanation } from "../types";

/**
 * Registry of explanations for each health rule type.
 * Keyed by rule ID (e.g., "rate-exchange_rate").
 */
export const healthExplanations: Record<string, HealthExplanation> = {
    // --- EXCHANGE RATE / COTIZACIÓN ---
    "rate-exchange_rate": {
        title: "Pagos Sin Cotización Válida",
        description: "Algunos pagos no tienen la cotización del día cargada correctamente. La cotización es el tipo de cambio vigente en el momento del pago, y siempre debe ser mayor a 1.",
        impact: "Sin la cotización correcta, el sistema no puede calcular correctamente los totales y los reportes financieros mostrarán valores incorrectos.",
        examples: [
            "Si el tipo de cambio del día es 1 USD = 1400 ARS, la cotización es 1400",
            "Si el tipo de cambio del día es 1 USD = 1250 ARS, la cotización es 1250",
            "La cotización siempre representa cuántos pesos vale 1 dólar ese día"
        ],
        action: {
            title: "Cargar cotización",
            description: "Editá cada pago afectado e ingresá la cotización correspondiente al día del pago. La cotización debe ser el valor del tipo de cambio (por ejemplo: 1400, 1250, etc.)."
        }
    },

    // --- REQUIRED FIELDS ---
    "req-payment_date": {
        title: "Fecha de Pago Faltante",
        description: "Algunos pagos no tienen fecha de pago registrada. Este campo es obligatorio para el correcto funcionamiento del sistema.",
        impact: "Los pagos sin fecha no aparecerán correctamente en reportes cronológicos y podrían afectar los cálculos de flujo de caja.",
        action: {
            title: "Completar fecha",
            description: "Editar cada pago afectado y agregar la fecha en que se realizó el cobro."
        }
    },

    "req-amount": {
        title: "Monto Faltante",
        description: "Algunos pagos no tienen monto registrado. Este campo es obligatorio.",
        impact: "Los pagos sin monto no se incluirán en los cálculos de totales cobrados y el balance será incorrecto.",
        action: {
            title: "Completar monto",
            description: "Editar cada pago afectado y agregar el monto correspondiente."
        }
    },

    // --- POSITIVE AMOUNTS ---
    "pos-amount": {
        title: "Monto Negativo Detectado",
        description: "Algunos pagos tienen montos negativos registrados. Esto puede indicar un error de carga o un reembolso no clasificado correctamente.",
        impact: "Los montos negativos restan del total cobrado. Si no son reembolsos intencionales, tus métricas financieras serán incorrectas.",
        action: {
            title: "Verificar montos",
            description: "Revisar cada pago con monto negativo. Si es un reembolso, considera registrarlo como tal. Si es un error, corrige el signo del monto."
        }
    },

    // --- DATE VALIDATION ---
    "no-future-payment_date": {
        title: "Fecha en el Futuro",
        description: "Algunos pagos tienen fechas futuras registradas. Los pagos representan cobros ya realizados, por lo que no deberían tener fechas futuras.",
        impact: "Los pagos con fechas futuras pueden aparecer incorrectamente en reportes y proyecciones.",
        action: {
            title: "Corregir fecha",
            description: "Editar cada pago afectado y establecer la fecha correcta en que se realizó el cobro."
        }
    },

    // --- GENERAL FALLBACK ---
    "unknown": {
        title: "Problema de Datos",
        description: "Se detectó un problema con los datos que requiere revisión.",
        impact: "La precisión de tus reportes puede verse afectada.",
        action: {
            title: "Revisar datos",
            description: "Verifica la información del registro afectado y corrige cualquier error."
        }
    }
};

/**
 * Get explanation for a rule ID, with fallback to "unknown"
 */
export function getHealthExplanation(ruleId: string): HealthExplanation {
    return healthExplanations[ruleId] || healthExplanations["unknown"];
}


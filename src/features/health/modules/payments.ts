import { calculateEntityHealth } from "../logic/calculator";
import { rulePositiveAmount, ruleRequired, ruleExchangeRate } from "../rules/common";
import { HealthMetric, HealthRule } from "../types";
import { ClientPaymentView } from "@/features/clients/types";

// --- 1. DEFINE RULES FOR A SINGLE PAYMENT ---
const paymentRules: HealthRule<ClientPaymentView>[] = [
    ruleRequired('payment_date', 'Fecha de pago') as HealthRule<ClientPaymentView>,
    ruleRequired('amount', 'Monto') as HealthRule<ClientPaymentView>,
    rulePositiveAmount('amount', 'Monto') as HealthRule<ClientPaymentView>,
    // Smart Exchange Rate Rule: Only flag if rate is missing/low but currency is NOT ARS
    {
        id: 'rate-exchange_rate',
        name: 'Cotización válida',
        description: 'Verifica que la cotización sea correcta para monedas extranjeras.',
        weight: 1.0,
        evaluate: (payment: ClientPaymentView) => {
            const rate = Number(payment.exchange_rate);
            const isRateValid = rate > 1;
            // Relax check for ARS (implicitly rate 1)
            // If currency_code is missing, we can't be sure, but let's assume if rate is > 1 it's fine.
            const isArs = payment.currency_code === 'ARS';

            if (isRateValid) {
                return {
                    score: 100,
                    status: 'excellent',
                    trend: 'stable',
                    currentValue: rate.toString()
                };
            }

            // Rate is <= 1 or NaN
            if (isArs) {
                return {
                    score: 100,
                    status: 'excellent',
                    trend: 'stable',
                    currentValue: '1 (ARS)'
                };
            }

            // Catch-all: Low rate for non-ARS (likely USD/EUR missing rate)
            return {
                score: 0,
                status: 'critical',
                trend: 'stable',
                currentValue: rate ? rate.toString() : 'Faltante',
                message: 'Falta la cotización para esta moneda extranjera.',
                recommendation: 'Carga la cotización del día.'
            };
        }
    } as HealthRule<ClientPaymentView>,
];

// --- 2. ANALYZE A COLLECTION OF PAYMENTS ---
export interface PaymentsHealthReport {
    totalPayments: number;
    healthyCount: number;
    issuesCount: number;
    criticalIssuesCount: number;
    score: number;
    issues: { paymentId: string; clientName: string; messages: string[] }[];
}

export function analyzePaymentsHealth(payments: ClientPaymentView[]): PaymentsHealthReport {
    let totalScoreSum = 0;
    let healthyCount = 0;
    let issuesCount = 0;
    let criticalIssuesCount = 0;
    const reportedIssues: { paymentId: string; clientName: string; messages: string[] }[] = [];

    payments.forEach(payment => {
        // Run rules for this payment
        const metrics: HealthMetric[] = paymentRules.map(rule => {
            const result = rule.evaluate(payment);
            return {
                id: rule.id,
                label: rule.name,
                weight: rule.weight,
                ...result
            };
        });

        const health = calculateEntityHealth(payment.id, 'payment', metrics);

        totalScoreSum += health.overallScore;

        if (health.overallScore < 90) {
            issuesCount++;
            if (health.overallStatus === 'critical' || health.overallStatus === 'poor') {
                criticalIssuesCount++;
            }

            // Collect messages for "bad" payments
            const messages = metrics
                .filter(m => m.score < 100 && m.message)
                .map(m => m.message!);

            if (messages.length > 0) {
                reportedIssues.push({
                    paymentId: payment.id,
                    clientName: payment.client_name || 'Desconocido',
                    messages
                });
            }
        } else {
            healthyCount++;
        }
    });

    const avgScore = payments.length > 0 ? Math.round(totalScoreSum / payments.length) : 100;

    return {
        totalPayments: payments.length,
        healthyCount,
        issuesCount,
        criticalIssuesCount,
        score: avgScore,
        issues: reportedIssues
    };
}

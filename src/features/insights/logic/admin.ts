/**
 * Admin Insights Adapter
 * 
 * Generates insights for the Admin dashboard based on platform-wide analytics.
 * Uses the generic InsightRule pattern from the insights system.
 */

import { Insight } from "../types";
import { DashboardData } from "@/features/admin/queries";

interface AdminInsightInput {
    kpis: DashboardData['kpis'];
    charts: DashboardData['charts'];
    lists: DashboardData['lists'];
}

/**
 * 1. Momento Óptimo de Engagement
 * Detecta las horas pico de actividad
 */
function peakActivityInsight(input: AdminInsightInput): Insight | null {
    const { activityByHour } = input.charts;
    if (!activityByHour || activityByHour.length === 0) return null;

    const total = activityByHour.reduce((sum, h) => sum + h.value, 0);
    if (total === 0) return null;

    // Find peak hours (top 3)
    const sorted = [...activityByHour].sort((a, b) => b.value - a.value);
    const topHours = sorted.slice(0, 3);
    const peakPercentage = Math.round((topHours.reduce((s, h) => s + h.value, 0) / total) * 100);

    if (peakPercentage < 30) return null; // Not concentrated enough

    const peakRange = topHours.map(h => h.hour).join(", ");

    return {
        id: "peak-activity-hours",
        severity: "info",
        title: "Horario pico detectado",
        description: `El ${peakPercentage}% de la actividad ocurre a las ${peakRange}hs.`,
        icon: "Clock",
        priority: 3,
        actionHint: "Programá notificaciones y emails en ese horario."
    };
}

/**
 * 2. Tasa de Crecimiento Acelerado
 * Compara mes actual vs promedio histórico
 */
function acceleratedGrowthInsight(input: AdminInsightInput): Insight | null {
    const { userGrowth } = input.charts;
    if (!userGrowth || userGrowth.length < 2) return null;

    const values = userGrowth.map(m => m.users);
    const currentMonth = values[values.length - 1];
    const previousMonths = values.slice(0, -1);
    const average = previousMonths.reduce((s, v) => s + v, 0) / previousMonths.length;

    if (average === 0) return null;

    const growthPercent = Math.round(((currentMonth - average) / average) * 100);

    if (growthPercent < 50) return null; // Not significant

    return {
        id: "accelerated-growth",
        severity: "positive",
        title: "Crecimiento acelerado",
        description: `Este mes: ${currentMonth} usuarios nuevos, ${growthPercent}% más que el promedio (${Math.round(average)}).`,
        icon: "TrendingUp",
        priority: 1,
        actionHint: "¡Buen momento para lanzar nuevas features!"
    };
}

/**
 * 3. Mercado Emergente Detectado
 * País con crecimiento inusual
 */
function emergingMarketInsight(input: AdminInsightInput): Insight | null {
    const { countryDistribution } = input.charts;
    if (!countryDistribution || countryDistribution.length < 2) return null;

    const total = countryDistribution.reduce((s, c) => s + c.value, 0);
    if (total < 10) return null; // Need enough data

    // Find countries with significant share but not dominant
    const emerging = countryDistribution.find(c => {
        const share = (c.value / total) * 100;
        return share >= 10 && share <= 35 && c.value >= 3;
    });

    if (!emerging) return null;

    const share = Math.round((emerging.value / total) * 100);

    return {
        id: "emerging-market",
        severity: "info",
        title: "Mercado en crecimiento",
        description: `${emerging.name} representa el ${share}% de usuarios (${emerging.value}).`,
        icon: "Globe",
        priority: 4,
        actionHint: "Considerá contenido localizado para ese mercado."
    };
}

/**
 * 4. Alerta de Abandono
 * Usuarios inactivos recientemente
 */
function churnAlertInsight(input: AdminInsightInput): Insight | null {
    const { dropOff } = input.lists;
    if (!dropOff || dropOff.length === 0) return null;

    const atRisk = dropOff.filter(u => u.session_count >= 3); // Fueron activos antes

    if (atRisk.length < 2) return null;

    return {
        id: "churn-alert",
        severity: "warning",
        title: "Usuarios en riesgo de abandono",
        description: `${atRisk.length} usuarios activos no han vuelto en 7+ días.`,
        icon: "UserMinus",
        priority: 2,
        actionHint: "Considerá enviar email de re-engagement."
    };
}

/**
 * 5. Feature Más Popular
 * Vista con más engagement
 */
function popularFeatureInsight(input: AdminInsightInput): Insight | null {
    const { engagement } = input.charts;
    if (!engagement || engagement.length === 0) return null;

    const sorted = [...engagement].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const total = engagement.reduce((s, e) => s + e.value, 0);

    if (total === 0) return null;

    const share = Math.round((top.value / total) * 100);
    if (share < 20) return null;

    return {
        id: "popular-feature",
        severity: "positive",
        title: "Feature más popular",
        description: `"${top.name}" concentra el ${share}% del uso total.`,
        icon: "Star",
        priority: 5,
        actionHint: "Es tu feature principal, priorizá mejoras ahí."
    };
}

/**
 * 6. Sesiones Cortas Críticas
 * Tiempo promedio muy bajo
 */
function shortSessionsInsight(input: AdminInsightInput): Insight | null {
    const { avgSessionDuration } = input.kpis;

    // Less than 60 seconds average is concerning
    if (avgSessionDuration >= 60) return null;

    return {
        id: "short-sessions",
        severity: "warning",
        title: "Sesiones demasiado cortas",
        description: `Duración promedio: ${avgSessionDuration}s. Puede indicar problemas de UX.`,
        icon: "Timer",
        priority: 2,
        actionHint: "Verificá el onboarding y tiempo de carga."
    };
}

/**
 * 7. Bounce Rate Alto
 */
function highBounceRateInsight(input: AdminInsightInput): Insight | null {
    const { bounceRate } = input.kpis;

    // Bounce rate over 50% is concerning
    if (bounceRate < 50) return null;

    return {
        id: "high-bounce-rate",
        severity: bounceRate > 65 ? "critical" : "warning",
        title: "Bounce rate elevado",
        description: `${bounceRate}% de usuarios abandonan rápidamente.`,
        icon: "DoorOpen",
        priority: 1,
        actionHint: "Revisá el onboarding y primera impresión."
    };
}

/**
 * 8. Ratio Usuarios/Organización
 * Oportunidad de crecimiento por invitaciones
 */
function usersPerOrgInsight(input: AdminInsightInput): Insight | null {
    const { totalUsers, totalOrgs } = input.kpis;

    if (totalOrgs === 0) return null;

    const ratio = totalUsers / totalOrgs;

    if (ratio >= 2) return null; // Good ratio

    return {
        id: "low-users-per-org",
        severity: "info",
        title: "Equipos pequeños",
        description: `Promedio: ${ratio.toFixed(1)} usuarios por organización.`,
        icon: "Users",
        priority: 4,
        actionHint: "Promové las invitaciones de equipo."
    };
}

/**
 * 9. Feature Subutilizado
 * Vista con bajo engagement
 */
function underutilizedFeatureInsight(input: AdminInsightInput): Insight | null {
    const { engagement } = input.charts;
    if (!engagement || engagement.length < 3) return null;

    const total = engagement.reduce((s, e) => s + e.value, 0);
    if (total === 0) return null;

    const sorted = [...engagement].sort((a, b) => a.value - b.value);
    const lowest = sorted[0];
    const share = Math.round((lowest.value / total) * 100);

    if (share >= 5) return null; // Not low enough

    return {
        id: "underutilized-feature",
        severity: "info",
        title: "Feature subutilizado",
        description: `"${lowest.name}" tiene solo ${share}% del tráfico.`,
        icon: "EyeOff",
        priority: 5,
        actionHint: "Considerá destacarlo más o mejorar su UX."
    };
}

/**
 * 10. Concentración de Top Users
 * Pareto de actividad
 */
function topUsersConcentrationInsight(input: AdminInsightInput): Insight | null {
    const { topUsers } = input.lists;
    const { totalUsers } = input.kpis;

    if (!topUsers || topUsers.length < 3 || totalUsers < 10) return null;

    const topSessions = topUsers.slice(0, 3).reduce((s, u) => s + u.sessions, 0);
    const totalSessions = topUsers.reduce((s, u) => s + u.sessions, 0);

    if (totalSessions === 0) return null;

    const concentration = Math.round((topSessions / totalSessions) * 100);

    if (concentration < 50) return null;

    return {
        id: "top-users-concentration",
        severity: concentration > 70 ? "warning" : "info",
        title: "Actividad concentrada",
        description: `Los top 3 usuarios generan el ${concentration}% de las sesiones.`,
        icon: "Crown",
        priority: 3,
        actionHint: "Riesgo de dependencia en pocos usuarios."
    };
}

/**
 * Main export: Generate all admin insights
 */
export function generateAdminInsights(input: AdminInsightInput): Insight[] {
    const rules = [
        peakActivityInsight,
        acceleratedGrowthInsight,
        emergingMarketInsight,
        churnAlertInsight,
        popularFeatureInsight,
        shortSessionsInsight,
        highBounceRateInsight,
        usersPerOrgInsight,
        underutilizedFeatureInsight,
        topUsersConcentrationInsight,
    ];

    const insights = rules
        .map(rule => rule(input))
        .filter((insight): insight is Insight => insight !== null);

    // Sort by priority (lower = more important)
    return insights.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

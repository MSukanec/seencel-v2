import { useMemo } from 'react';
import { useOrganization } from '@/stores/organization-store';
import { useFeatureFlags } from '@/providers/feature-flags-provider';

// ============================================================================
// ENTITLEMENT ENGINE (Vercel-Tier Access Control)
// ============================================================================
// Unifica Feature Flags (Booleanos), Limits (Quotas) y Mantenimiento.
// Incorpora el "Shadow Mode" para que los Admins puedan ver el bloqueo
// gráficamente pero tengan permisos de bypass al clickear.
// ============================================================================

export type EntitlementKey =
    // Features booleanos (JSON del Plan)
    | 'feature:pdf_templates'
    | 'feature:api_access'
    | 'feature:custom_domain'
    // Quotas numéricas (JSON del Plan)
    | 'quota:members'
    | 'quota:external_advisors'
    | 'quota:projects'
    // Contextos Generales (Feature Flags de DB)
    | 'context:workspace'
    | 'context:academy'
    | 'context:discover'
    | 'context:founders'
    // Flex flag key
    | `flag:${string}`;

export interface EntitlementResult {
    /** Si el usuario actual tiene permitido realizar la acción */
    isAllowed: boolean;
    /** Si está bloqueado para el cliente pero el Admin tiene pase libre (Shadow Mode visual) */
    isShadowMode: boolean;
    /** Razón semántica del bloqueo para pintar la UI correspondiente */
    reason: 'plan_required' | 'maintenance' | 'coming_soon' | 'hidden' | 'quota_exceeded' | 'founders' | null;
    /** Si la razón es 'plan_required', cuál plan sugiere mejorar */
    requiredPlan?: string;
    /** En caso de ser una quota, devuelve el estado actual vs límite */
    usageContext?: { current: number; max: number };
    /** El estado real que origino la decision (util para badges en UI) */
    rawStatus?: string;
}

/** Entitlement Engine Master Hook */
export function useEntitlements() {
    const { planFeatures, isFounder } = useOrganization();
    const { statuses, isAdmin } = useFeatureFlags();

    const checkEntitlement = (key: EntitlementKey, currentUsage?: number): EntitlementResult => {
        // 1. Evaluar Feature Flags Directos (DB) y Contextos Hardcodeados
        if (key.startsWith('context:') || key.startsWith('flag:')) {
            let flagKey = key.replace('flag:', '');
            
            // Map known contexts to their db flags
            if (key === 'context:workspace') flagKey = 'context_workspace_enabled';
            if (key === 'context:academy') flagKey = 'context_academy_enabled';
            if (key === 'context:discover') flagKey = 'context_discover_enabled';
            if (key === 'context:founders') flagKey = 'context_founders_enabled';

            const flag = statuses[flagKey];
            const status = flag || 'active';

            if (status === 'hidden') {
                return { isAllowed: isAdmin, isShadowMode: isAdmin, reason: 'hidden', rawStatus: status };
            }
            if (status === 'maintenance') {
                return { isAllowed: isAdmin, isShadowMode: isAdmin, reason: 'maintenance', rawStatus: status };
            }
            if (status === 'coming_soon') {
                return { isAllowed: isAdmin, isShadowMode: isAdmin, reason: 'coming_soon', rawStatus: status };
            }
            if (status === 'founders' || flagKey === 'founders') {
                const canAccess = isAdmin || isFounder;
                return { isAllowed: canAccess, isShadowMode: isAdmin && !isFounder, reason: 'founders', rawStatus: status };
            }
            return { isAllowed: true, isShadowMode: false, reason: null, rawStatus: status };
        }

        // 2. Evaluar Features (Plan Limits)
        if (key.startsWith('feature:')) {
            const featureName = key.replace('feature:', '');
            // Por default, si no hay planFeatures, asumimos que está bloqueado si no es admin, 
            // pero para no romper a usuarios free actuales con cosas básicas, 
            // dependerá de la definición estricta. Asumiremos falso por default para features PRO.
            const hasFeature = planFeatures?.[featureName] === true;

            if (!hasFeature) {
                return {
                    isAllowed: isAdmin,
                    isShadowMode: isAdmin, // Si es admin, ve el botón gris pero le deja hacer click
                    reason: 'plan_required',
                    requiredPlan: 'PRO' // Todo: leer de un mapa de requerimientos
                };
            }
            return { isAllowed: true, isShadowMode: false, reason: null };
        }

        // 3. Evaluar Quotas (Plan Limits Numéricos)
        if (key.startsWith('quota:')) {
            const quotaName = key.replace('quota:', '');
            // "max_members", "max_external_advisors"
            const maxAllowed = planFeatures?.[`max_${quotaName}`];
            
            if (typeof maxAllowed === 'number' && typeof currentUsage === 'number') {
                if (currentUsage >= maxAllowed) {
                    return {
                        isAllowed: isAdmin, // Admins sobrepasan el límite
                        isShadowMode: isAdmin,
                        reason: 'quota_exceeded',
                        requiredPlan: 'TEAMS',
                        usageContext: { current: currentUsage, max: maxAllowed }
                    };
                }
            }
            return { isAllowed: true, isShadowMode: false, reason: null };
        }

        return { isAllowed: true, isShadowMode: false, reason: null };
    };

    // Memoized checker function
    const isActionAllowed = useMemo(() => checkEntitlement, [planFeatures, isFounder, statuses, isAdmin]);

    return {
        check: isActionAllowed,
        isAdmin, // Exposed explicitly for UI wrappers that need to know if they are god mode
    };
}

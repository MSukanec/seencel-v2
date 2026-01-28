"use client";

import { useState, useTransition, useMemo } from "react";
import { FeatureFlag, FlagCategory, updateFeatureFlagStatus } from "@/actions/feature-flags";
import { Lock, EyeOff, Activity } from "lucide-react";
import { CategoryTree, CategoryItem } from "@/components/shared/category-tree";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FeatureFlagsManagerProps {
    initialFlags: FeatureFlag[];
    categories?: FlagCategory[];
}

// Translation Dictionary
const FLAG_TRANSLATIONS: Record<string, string> = {
    'context_workspace_enabled': 'Acceso Espacio de Trabajo',
    'context_academy_enabled': 'Acceso Academia',
    'context_community_enabled': 'Acceso Comunidad',
    'context_community_map_enabled': 'Comunidad: Mapa Seencel',
    'context_community_founders_enabled': 'Comunidad: Directorio Fundadores',
    'dashboard_maintenance_mode': 'Modo Mantenimiento Global',
    'pro_purchases_enabled': 'Habilitar Compra Plan Pro',
    'teams_purchases_enabled': 'Habilitar Compra Plan Teams',
    'course_purchases_enabled': 'Habilitar Compra Cursos',
    'mp_test_mode': 'MercadoPago: Modo Test',
    'paypal_test_mode': 'PayPal: Modo Test',
};

type FlagStatus = 'active' | 'maintenance' | 'founders' | 'hidden';

export function FeatureFlagsManager({ initialFlags, categories = [] }: FeatureFlagsManagerProps) {
    const router = useRouter();
    const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (flagKey: string, newStatus: FlagStatus) => {
        startTransition(async () => {
            const original = flags.find(f => f.key === flagKey);
            setFlags(prev => prev.map(f => f.key === flagKey ? {
                ...f,
                status: newStatus,
                value: newStatus === 'active'
            } : f));

            const result = await updateFeatureFlagStatus(flagKey, newStatus);
            if (!result.success) {
                toast.error("Error al actualizar estado");
                if (original) setFlags(prev => prev.map(f => f.key === flagKey ? original : f));
            } else {
                router.refresh();
            }
        });
    };

    const treeItems = useMemo(() => {
        // Build Categories
        const catItems: CategoryItem[] = categories.map(c => ({
            id: c.id,
            name: c.name,
            parent_id: c.parent_id,
            order: c.position,
            isFolder: true
        }));

        // Build Flags
        const flgItems: CategoryItem[] = flags.map(f => ({
            id: f.id,
            name: FLAG_TRANSLATIONS[f.key] || f.description || f.key,
            parent_id: f.category_id || null, // Will match category ID if exists
            order: f.position || 99,
            // Extra props
            originalKey: f.key,
            description: f.description,
            status: f.status || (f.value ? 'active' : 'hidden'),
            isFolder: false
        }));

        return [...catItems, ...flgItems];
    }, [flags, categories]);

    return (
        <div className="space-y-4">
            <CategoryTree
                items={treeItems}
                emptyMessage="No hay items configurables."
                showNumbering={false}
                renderEndContent={(item) => {
                    if (item.isFolder) return null;

                    return (
                        <div className="flex items-center gap-4 mr-2">
                            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground hidden xl:inline-flex">
                                {item.originalKey}
                            </Badge>

                            <Select
                                value={item.status as FlagStatus}
                                onValueChange={(val) => handleStatusChange(item.originalKey, val as FlagStatus)}
                                disabled={isPending}
                            >
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <div className="flex items-center gap-2">
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-3 w-3 text-green-500" />
                                            <span>Habilitado</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-3 w-3 text-orange-500" />
                                            <span>Mantenimiento</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="founders">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-3 w-3 text-yellow-500" />
                                            <span>Fundadores</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="hidden">
                                        <div className="flex items-center gap-2">
                                            <EyeOff className="h-3 w-3 text-gray-500" />
                                            <span>Oculto</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    );
                }}
            />

            <div className="text-xs text-muted-foreground px-4 space-y-1 mt-8 border-t pt-4">
                <p><b>Habilitado:</b> Visible y accesible para todos.</p>
                <p><b>Mantenimiento:</b> Visible (Admin) / Bloqueado (Usuario).</p>
                <p><b>Oculto:</b> Invisible (User) / Translúcido (Admin).</p>
            </div>
        </div>
    );
}

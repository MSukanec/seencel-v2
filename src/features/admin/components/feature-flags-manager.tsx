"use client";

import { useState, useTransition, useMemo } from "react";
import { FeatureFlag, FlagCategory, updateFeatureFlagStatus } from "@/actions/feature-flags";
import { Lock, EyeOff, Activity, Clock } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

interface FeatureFlagsManagerProps {
    initialFlags: FeatureFlag[];
    categories?: FlagCategory[];
}

// Translation Dictionary
const FLAG_TRANSLATIONS: Record<string, string> = {
    'context_workspace_enabled': 'Acceso Espacio de Trabajo',
    'context_portal_enabled': 'Acceso Portal de Clientes',
    'context_academy_enabled': 'Acceso Academia',
    'context_community_enabled': 'Acceso Comunidad',
    'context_community_map_enabled': 'Comunidad: Mapa Seencel',
    'context_community_founders_enabled': 'Comunidad: Directorio Fundadores',
    'dashboard_maintenance_mode': 'Modo Mantenimiento Global',
    'pro_purchases_enabled': 'Habilitar Compra Plan Pro',
    'teams_purchases_enabled': 'Habilitar Compra Plan Teams',
    'course_purchases_enabled': 'Habilitar Compra Cursos',
    'mp_enabled': 'MercadoPago',
    'paypal_enabled': 'PayPal',
};

type FlagStatus = 'active' | 'maintenance' | 'founders' | 'hidden' | 'coming_soon';

// Flags that should use a simple Switch (on/off) instead of status dropdown
const SIMPLE_TOGGLE_FLAGS = ['mp_enabled', 'paypal_enabled'];

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

                    const isSimpleToggle = SIMPLE_TOGGLE_FLAGS.includes(item.originalKey);

                    return (
                        <div className="flex items-center gap-4 mr-2">
                            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground hidden xl:inline-flex">
                                {item.originalKey}
                            </Badge>

                            {/* Simple Switch for payment method flags */}
                            {isSimpleToggle ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {item.status === 'active' ? 'Habilitado' : 'Deshabilitado'}
                                    </span>
                                    <Switch
                                        checked={item.status === 'active'}
                                        onCheckedChange={(checked) =>
                                            handleStatusChange(item.originalKey, checked ? 'active' : 'hidden')
                                        }
                                        disabled={isPending}
                                    />
                                </div>
                            ) : (
                                /* Status dropdown for other flags */
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
                                        <SelectItem value="coming_soon">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-blue-500" />
                                                <span>Próximamente</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    );
                }}
            />

            <div className="text-xs text-muted-foreground px-4 space-y-1 mt-8 border-t pt-4">
                <p><b>Habilitado:</b> Visible y accesible para todos.</p>
                <p><b>Mantenimiento:</b> Visible (Admin) / Bloqueado (Usuario).</p>
                <p><b>Próximamente:</b> Muestra "Próximamente" en botones. Admin puede bypass.</p>
                <p><b>Oculto:</b> Invisible (User) / Translúcido (Admin).</p>
            </div>
        </div>
    );
}

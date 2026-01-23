"use client";

import { useState, useTransition } from "react";
import { FeatureFlag, toggleFeatureFlag } from "@/actions/feature-flags";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ToggleLeft, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureFlagsManagerProps {
    initialFlags: FeatureFlag[];
}

// Map flag keys to friendly names and icons
const flagMetadata: Record<string, { name: string; warning?: boolean }> = {
    dashboard_maintenance_mode: {
        name: "Modo Mantenimiento",
        warning: true
    },
    pro_purchases_enabled: {
        name: "Compras Plan Pro"
    },
    teams_purchases_enabled: {
        name: "Compras Plan Teams"
    }
};

export function FeatureFlagsManager({ initialFlags }: FeatureFlagsManagerProps) {
    const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
    const [pendingFlag, setPendingFlag] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleToggle = (flagKey: string) => {
        setPendingFlag(flagKey);
        startTransition(async () => {
            const result = await toggleFeatureFlag(flagKey);
            if (result.success) {
                setFlags(prev => prev.map(f =>
                    f.key === flagKey ? { ...f, value: result.value! } : f
                ));
            }
            setPendingFlag(null);
        });
    };

    // Group flags by category
    const groupedFlags = flags.reduce((acc, flag) => {
        const category = flag.category || "general";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(flag);
        return acc;
    }, {} as Record<string, FeatureFlag[]>);

    const categoryNames: Record<string, string> = {
        system: "Sistema",
        billing: "Facturación",
        general: "General"
    };

    return (
        <div className="space-y-6">
            {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
                <Card key={category}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ToggleLeft className="h-5 w-5" />
                            {categoryNames[category] || category}
                        </CardTitle>
                        <CardDescription>
                            Feature flags de {categoryNames[category]?.toLowerCase() || category}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {categoryFlags.map(flag => {
                                const meta = flagMetadata[flag.key];
                                const isLoading = pendingFlag === flag.key && isPending;

                                return (
                                    <div
                                        key={flag.id}
                                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {meta?.name || flag.key}
                                                </span>
                                                {meta?.warning && flag.value && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Activo
                                                    </Badge>
                                                )}
                                            </div>
                                            {flag.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {flag.description}
                                                </p>
                                            )}
                                            <code className="text-xs text-muted-foreground/60 font-mono">
                                                {flag.key}
                                            </code>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isLoading && (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                            <Switch
                                                checked={flag.value}
                                                onCheckedChange={() => handleToggle(flag.key)}
                                                disabled={isLoading}
                                                className={cn(
                                                    meta?.warning && flag.value && "data-[state=checked]:bg-destructive"
                                                )}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {flags.length === 0 && (
                <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <ToggleLeft className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-lg">Sin Feature Flags</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        No hay feature flags configurados en el sistema.
                    </p>
                </div>
            )}
        </div>
    );
}


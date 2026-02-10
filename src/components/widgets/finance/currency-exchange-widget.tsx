"use client";

import { BentoCard } from "@/components/widgets/grid/bento-card";
import { RefreshCw, ArrowLeftRight } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { useCurrency } from "@/stores/organization-store";
import { Button } from "@/components/ui/button";

export function CurrencyExchangeWidget({ size = 'sm' }: { size?: 'sm' }) {
    const money = useMoney();
    const { secondaryCurrency } = useCurrency();

    return (
        <BentoCard
            size={size as any}
            title="Tipo de Cambio"
            subtitle="Cotización actual"
            icon={<ArrowLeftRight className="w-4 h-4" />}
        >
            <div className="flex flex-col items-center justify-center gap-1 h-full">
                <div className="text-3xl font-bold tracking-tight font-mono">
                    ${money.config.currentExchangeRate.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground">
                    1 {secondaryCurrency?.symbol || "USD"} = {money.config.currentExchangeRate} Base
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-2">
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Actualizar
                </Button>
            </div>
        </BentoCard>
    );
}

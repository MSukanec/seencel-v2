"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ListItem } from "@/components/ui/list-item";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { HardHat, MoreHorizontal, Pencil, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/providers/modal-store";
import { LaborTypeWithPrice } from "../types";
import { LaborPriceForm } from "../forms/labor-price-form";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface Currency {
    id: string;
    code: string;
    symbol: string;
    name: string;
}

export interface LaborTypesViewProps {
    laborTypes: LaborTypeWithPrice[];
    currencies: Currency[];
    orgId: string;
    defaultCurrencyId: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function LaborTypesView({
    laborTypes,
    currencies,
    orgId,
    defaultCurrencyId,
}: LaborTypesViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");

    // Filter labor types by search
    const filteredTypes = laborTypes.filter(lt => {
        const query = searchQuery.toLowerCase();
        return (
            lt.name?.toLowerCase().includes(query) ||
            lt.category_name?.toLowerCase().includes(query) ||
            lt.level_name?.toLowerCase().includes(query) ||
            lt.role_name?.toLowerCase().includes(query)
        );
    });

    // Handler to open price edit modal
    const handleEditPrice = (laborType: LaborTypeWithPrice) => {
        openModal(
            <LaborPriceForm
                laborType={laborType}
                organizationId={orgId}
                currencies={currencies}
                defaultCurrencyId={laborType.currency_id || defaultCurrencyId}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                    toast.success("Precio actualizado");
                }}
            />,
            {
                title: "Establecer Precio",
                description: `Define el costo por ${laborType.unit_name || 'unidad'} para "${laborType.name}"`,
                size: "sm"
            }
        );
    };

    // EmptyState for no types
    if (laborTypes.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Buscar tipos de mano de obra..."
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={HardHat}
                        title="Sin tipos de mano de obra"
                        description="No hay tipos de mano de obra disponibles en el sistema."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar por nombre, categoría, nivel o rol..."
            />

            <div className="space-y-2">
                {filteredTypes.length === 0 ? (
                    <div className="py-12 flex items-center justify-center">
                        <EmptyState
                            icon={HardHat}
                            title="Sin resultados"
                            description="Probá con otro término de búsqueda"
                        />
                    </div>
                ) : (
                    filteredTypes.map((laborType) => {
                        const hasPrice = laborType.current_price !== null;

                        return (
                            <ListItem key={laborType.id} variant="card">
                                <ListItem.Content>
                                    <ListItem.Title suffix={laborType.unit_symbol ? `(${laborType.unit_symbol})` : undefined}>
                                        {laborType.name}
                                    </ListItem.Title>
                                    <ListItem.Badges>
                                        {laborType.category_name && (
                                            <Badge variant="secondary" className="text-xs">
                                                {laborType.category_name}
                                            </Badge>
                                        )}
                                        {laborType.level_name && (
                                            <Badge variant="secondary" className="text-xs">
                                                {laborType.level_name}
                                            </Badge>
                                        )}
                                        {laborType.role_name && (
                                            <Badge variant="secondary" className="text-xs">
                                                {laborType.role_name}
                                            </Badge>
                                        )}
                                    </ListItem.Badges>
                                </ListItem.Content>

                                <ListItem.Trailing>
                                    {hasPrice ? (
                                        <>
                                            <ListItem.Value>
                                                {laborType.currency_symbol}{' '}
                                                {laborType.current_price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </ListItem.Value>
                                            <ListItem.ValueSubtext>
                                                por {laborType.unit_name}
                                            </ListItem.ValueSubtext>
                                        </>
                                    ) : (
                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                            Sin precio
                                        </Badge>
                                    )}
                                </ListItem.Trailing>

                                <ListItem.Actions>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditPrice(laborType)}>
                                                {hasPrice ? (
                                                    <><Pencil className="mr-2 h-4 w-4" /> Editar precio</>
                                                ) : (
                                                    <><DollarSign className="mr-2 h-4 w-4" /> Establecer precio</>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </ListItem.Actions>
                            </ListItem>
                        );
                    })
                )}
            </div>
        </>
    );
}


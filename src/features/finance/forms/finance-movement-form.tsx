"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Receipt,
    Package,
    Wrench,
    Wallet,
    Users,
    ArrowLeft,
    Landmark,
    ArrowUpFromLine,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// === Form imports (lazy) ===
import { PaymentForm as GeneralCostsPaymentForm } from "@/features/general-costs/forms/general-costs-payment-form";
// These will be added as we integrate more forms:
// import { PaymentForm as ClientPaymentForm } from "@/features/clients/components/forms/payment-form";
// import { SubcontractPaymentForm } from "@/features/subcontracts/components/forms/subcontract-payment-form";
// import { MaterialPaymentForm } from "@/features/materials/components/forms/material-payment-form";

// === Movement Types ===
export type MovementCategory = 'income' | 'expense' | 'transfer';

export interface MovementType {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    category: MovementCategory;
    form: 'general_cost' | 'client_payment' | 'subcontract_payment' | 'material_payment' | 'wallet_transfer' | 'currency_exchange';
    available: boolean;
}

const MOVEMENT_TYPES: MovementType[] = [
    // === INGRESOS ===
    {
        id: 'client_payment',
        label: 'Cobro de Cliente',
        description: 'Registrar un pago recibido de un cliente',
        icon: Users,
        category: 'income',
        form: 'client_payment',
        available: false, // TODO: Integrate client payment form
    },
    {
        id: 'partner_contribution',
        label: 'Aporte de Capital',
        description: 'Ingreso de capital de socios',
        icon: Landmark,
        category: 'income',
        form: 'general_cost', // Uses general costs with different type
        available: false, // TODO: Create specific flow
    },
    // === EGRESOS ===
    {
        id: 'general_cost',
        label: 'Gastos Generales',
        description: 'Servicios, sueldos y gastos operativos',
        icon: Receipt,
        category: 'expense',
        form: 'general_cost',
        available: true,
    },
    {
        id: 'subcontract_payment',
        label: 'Pago de Subcontrato',
        description: 'Pago a un subcontratista',
        icon: Wrench,
        category: 'expense',
        form: 'subcontract_payment',
        available: false,
    },
    {
        id: 'material_payment',
        label: 'Pago de Materiales',
        description: 'Pago de compra de materiales',
        icon: Package,
        category: 'expense',
        form: 'material_payment',
        available: false,
    },
    {
        id: 'partner_withdrawal',
        label: 'Retiro de Capital',
        description: 'Retiro de capital de socios',
        icon: ArrowUpFromLine,
        category: 'expense',
        form: 'general_cost',
        available: false,
    },
    // === TRANSFERENCIAS ===
    {
        id: 'wallet_transfer',
        label: 'Transferencia entre Billeteras',
        description: 'Mover dinero entre cuentas',
        icon: ArrowRightLeft,
        category: 'transfer',
        form: 'wallet_transfer',
        available: false,
    },
    {
        id: 'currency_exchange',
        label: 'Cambio de Moneda',
        description: 'Convertir entre monedas',
        icon: DollarSign,
        category: 'transfer',
        form: 'currency_exchange',
        available: false,
    },
];

const CATEGORY_CONFIG: Record<MovementCategory, { label: string; icon: React.ElementType; color: string; bgColor: string; link: string }> = {
    income: { label: 'Ingresos', icon: TrendingUp, color: 'text-amount-positive', bgColor: 'bg-amount-positive/10', link: '/clients' },
    expense: { label: 'Egresos', icon: TrendingDown, color: 'text-amount-negative', bgColor: 'bg-amount-negative/10', link: '/general-costs' },
    transfer: { label: 'Transferencias', icon: ArrowRightLeft, color: 'text-muted-foreground', bgColor: 'bg-muted', link: '/finance' },
};

// === Props ===
interface FinanceMovementFormProps {
    // General Costs context
    concepts?: any[];
    wallets?: { id: string; wallet_name: string }[];
    currencies?: { id: string; code: string; symbol: string }[];
    organizationId: string;
    // Project context (optional - for project-level payments)
    projectId?: string;
    // Callbacks
    onSuccess?: () => void;
    onCancel?: () => void;
}

// === Type Selector Card ===
function TypeCard({
    type,
    onClick,
    disabled
}: {
    type: MovementType;
    onClick: () => void;
    disabled?: boolean;
}) {
    const Icon = type.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || !type.available}
            className={cn(
                "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left h-16",
                "hover:border-primary hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                disabled || !type.available
                    ? "opacity-50 cursor-not-allowed border-muted"
                    : "border-border cursor-pointer"
            )}
        >
            <div className={cn(
                "p-2 rounded-lg shrink-0",
                CATEGORY_CONFIG[type.category].bgColor
            )}>
                <Icon className={cn(
                    "h-4 w-4",
                    CATEGORY_CONFIG[type.category].color
                )} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{type.label}</p>
                <p className="text-xs text-muted-foreground truncate">{type.description}</p>
            </div>
            {!type.available && (
                <span className="shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    Pronto
                </span>
            )}
        </button>
    );
}

// === Category Section ===
function CategorySection({
    category,
    types,
    onSelectType,
    closeModal
}: {
    category: MovementCategory;
    types: MovementType[];
    onSelectType: (type: MovementType) => void;
    closeModal?: () => void;
}) {
    const config = CATEGORY_CONFIG[category];
    const Icon = config.icon;

    return (
        <div className="space-y-2 flex flex-col">
            <Link
                href={config.link}
                onClick={closeModal}
                className={cn(
                    "flex items-center gap-2 group hover:underline w-fit",
                    config.color
                )}
            >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-semibold">{config.label}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <div className="flex flex-col gap-2">
                {types.map((type) => (
                    <TypeCard
                        key={type.id}
                        type={type}
                        onClick={() => onSelectType(type)}
                    />
                ))}
            </div>
        </div>
    );
}

// === Main Component ===
export function FinanceMovementForm({
    concepts = [],
    wallets = [],
    currencies = [],
    organizationId,
    projectId,
    onSuccess,
    onCancel,
}: FinanceMovementFormProps) {
    const [selectedType, setSelectedType] = useState<MovementType | null>(null);

    // Group types by category
    const incomeTypes = MOVEMENT_TYPES.filter(t => t.category === 'income');
    const expenseTypes = MOVEMENT_TYPES.filter(t => t.category === 'expense');
    const transferTypes = MOVEMENT_TYPES.filter(t => t.category === 'transfer');

    // Handle back to type selection
    const handleBack = () => {
        setSelectedType(null);
    };

    // Handle form success
    const handleFormSuccess = () => {
        onSuccess?.();
    };

    // === TYPE SELECTION VIEW ===
    if (!selectedType) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
                <CategorySection
                    category="income"
                    types={incomeTypes}
                    onSelectType={setSelectedType}
                    closeModal={onCancel}
                />
                <CategorySection
                    category="expense"
                    types={expenseTypes}
                    onSelectType={setSelectedType}
                    closeModal={onCancel}
                />
                <CategorySection
                    category="transfer"
                    types={transferTypes}
                    onSelectType={setSelectedType}
                    closeModal={onCancel}
                />
            </div>
        );
    }

    // === FORM VIEW ===
    const Icon = selectedType.icon;
    const categoryConfig = CATEGORY_CONFIG[selectedType.category];

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header with back button */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="h-8 w-8 p-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className={cn(
                    "p-2 rounded-lg",
                    CATEGORY_CONFIG[selectedType.category].bgColor
                )}>
                    <Icon className={cn(
                        "h-4 w-4",
                        CATEGORY_CONFIG[selectedType.category].color
                    )} />
                </div>
                <div>
                    <p className="font-semibold text-sm">{selectedType.label}</p>
                    <p className="text-xs text-muted-foreground">{selectedType.description}</p>
                </div>
            </div>

            {/* Form content */}
            <div className="flex-1 min-h-0">
                {selectedType.form === 'general_cost' && (
                    <GeneralCostsPaymentForm
                        concepts={concepts}
                        wallets={wallets}
                        currencies={currencies}
                        organizationId={organizationId}
                        onSuccess={handleFormSuccess}
                        onCancel={onCancel}
                    />
                )}

                {/* Placeholder for other forms */}
                {selectedType.form !== 'general_cost' && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                            {selectedType.label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Este formulario estará disponible próximamente.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={handleBack}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

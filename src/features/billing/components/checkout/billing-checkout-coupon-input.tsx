"use client";

// ============================================================
// BILLING CHECKOUT COUPON INPUT
// ============================================================
// Input para aplicar cupones de descuento
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X, Loader2 } from "lucide-react";
import type { AppliedCoupon } from "@/features/billing/types/checkout";

// ============================================================
// PROPS
// ============================================================

interface BillingCheckoutCouponInputProps {
    code: string;
    onCodeChange: (code: string) => void;
    appliedCoupon: AppliedCoupon | null;
    couponError: string | null;
    couponLoading: boolean;
    onApply: () => Promise<void>;
    onRemove: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export function BillingCheckoutCouponInput({
    code,
    onCodeChange,
    appliedCoupon,
    couponError,
    couponLoading,
    onApply,
    onRemove,
}: BillingCheckoutCouponInputProps) {
    const [showInput, setShowInput] = useState(false);

    // If coupon is applied, show badge
    if (appliedCoupon) {
        return (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/30">
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <div>
                        <span className="text-sm font-medium text-primary">
                            {appliedCoupon.code}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                            {appliedCoupon.type === "percent"
                                ? `${appliedCoupon.amount}% OFF`
                                : `USD $${appliedCoupon.amount} OFF`
                            }
                        </span>
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    // If input not shown, show toggle button
    if (!showInput) {
        return (
            <button
                onClick={() => setShowInput(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <Tag className="h-4 w-4" />
                ¿Tenés un cupón?
            </button>
        );
    }

    // Show input form
    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    placeholder="Código de cupón"
                    className="flex-1"
                    disabled={couponLoading}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onApply();
                        }
                    }}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onApply}
                    disabled={couponLoading || !code.trim()}
                >
                    {couponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Aplicar"
                    )}
                </Button>
            </div>
            {couponError && (
                <p className="text-xs text-destructive">{couponError}</p>
            )}
        </div>
    );
}

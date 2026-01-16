"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X, Eye, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentsHealthReport } from "../modules/payments";
import { HealthIssueExplainerModal } from "./health-issue-explainer-modal";

interface HealthMonitorBannerProps {
    report: PaymentsHealthReport;
    moduleName: string;
    /** Unique key for session storage (e.g. "clients-page" or "expenses-page") */
    storageKey?: string;
    /** Callback to show affected records - navigates to Payments tab and activates filter */
    onShowAffected?: () => void;
    /** Whether the filter is currently active */
    isFilterActive?: boolean;
    /** Callback to clear the filter */
    onClearFilter?: () => void;
}

export function HealthMonitorBanner({
    report,
    moduleName,
    storageKey = "health-banner",
    onShowAffected,
    isFilterActive = false,
    onClearFilter
}: HealthMonitorBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

    // Check sessionStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const dismissed = sessionStorage.getItem(`${storageKey}-dismissed`);
            if (dismissed === "true") {
                setIsDismissed(true);
            }
        }
    }, [storageKey]);

    const handleDismiss = () => {
        setIsDismissed(true);
        if (typeof window !== "undefined") {
            sessionStorage.setItem(`${storageKey}-dismissed`, "true");
        }
    };

    if (isDismissed || report.issuesCount === 0) return null;

    const isCritical = report.criticalIssuesCount > 0;

    // Custom styling for "Warning" look if not critical
    const alertClass = isCritical
        ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
        : "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400";

    const iconClass = isCritical
        ? "h-5 w-5 shrink-0 !text-red-500"
        : "h-5 w-5 shrink-0 !text-orange-500";

    // Primary rule ID for the modal
    const primaryRuleId = "rate-exchange_rate";

    const handleOpenModal = (ruleId: string = primaryRuleId) => {
        setSelectedRuleId(ruleId);
        setModalOpen(true);
    };

    const handleShowAffected = () => {
        if (onShowAffected) {
            onShowAffected();
        }
    };

    return (
        <>
            <Alert className={`mb-6 relative transition-all ${alertClass}`}>
                <AlertCircle className={iconClass} />
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between">
                        <AlertTitle className="text-base font-semibold flex items-center gap-2">
                            Atención: Detectamos {report.issuesCount} problemas en tus {moduleName}
                            {isCritical && (
                                <Badge variant="destructive" className="ml-2 text-xs">Crítico</Badge>
                            )}
                        </AlertTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 hover:bg-transparent hover:underline"
                                onClick={() => handleOpenModal()}
                            >
                                <Info className="h-4 w-4" />
                                Más información
                            </Button>
                            {onShowAffected && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1 hover:bg-transparent hover:underline"
                                    onClick={handleShowAffected}
                                >
                                    <Eye className="h-4 w-4" />
                                    Mostrar
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-2"
                                onClick={handleDismiss}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cerrar</span>
                            </Button>
                        </div>
                    </div>

                    <AlertDescription>
                        La salud de tus datos es del {report.score}%. Hay {report.issuesCount} registros que requieren revisión para asegurar la precisión de tus reportes.
                        {isFilterActive && onClearFilter && (
                            <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 ml-2 text-current underline"
                                onClick={onClearFilter}
                            >
                                Limpiar filtro
                            </Button>
                        )}
                    </AlertDescription>
                </div>
            </Alert>

            {/* Modal for detailed explanation */}
            {selectedRuleId && (
                <HealthIssueExplainerModal
                    ruleId={selectedRuleId}
                    affectedCount={report.issuesCount}
                    isCritical={isCritical}
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                />
            )}
        </>
    );
}

"use client";

import { useState } from "react";
import { AlertTriangle, X, Info, Lightbulb } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HealthExplanation } from "../types";
import { getHealthExplanation } from "../content/health-explanations";

interface HealthIssueExplainerModalProps {
    ruleId: string;
    affectedCount: number;
    isCritical?: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HealthIssueExplainerModal({
    ruleId,
    affectedCount,
    isCritical = false,
    open,
    onOpenChange
}: HealthIssueExplainerModalProps) {
    const explanation = getHealthExplanation(ruleId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
                            <AlertTriangle className={`h-5 w-5 ${isCritical ? 'text-red-500' : 'text-orange-500'}`} />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg">
                                {explanation.title}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                {isCritical && (
                                    <Badge variant="destructive" className="text-xs">Crítico</Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                    {affectedCount} afectados
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Description */}
                    <DialogDescription className="text-sm text-foreground/80">
                        {explanation.description}
                    </DialogDescription>

                    {/* Examples */}
                    {explanation.examples && explanation.examples.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Ejemplos de cotización válida:
                            </p>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                {explanation.examples.map((example, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                        {example}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Impact */}
                    <p className="text-sm text-muted-foreground">
                        {explanation.impact}
                    </p>

                    {/* Action */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-lime-500/10 border border-lime-500/30">
                        <Lightbulb className="h-5 w-5 text-lime-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm text-lime-500">
                                {explanation.action.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {explanation.action.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end mt-4">
                    <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

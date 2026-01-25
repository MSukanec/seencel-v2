"use client";

import { useEffect, useState } from "react";
import { ImportConfig, findBestMatch } from "@/lib/import-utils";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getMappingPatterns } from "@/actions/import-mapping";
import { useTranslations } from "next-intl";

interface ImportStepMappingProps {
    config: ImportConfig;
    headers: string[];
    initialMapping: Record<string, string>;
    onChange: (mapping: Record<string, string>, isValid: boolean) => void;
    organizationId: string;
    previewData?: any;
}

export function ImportStepMapping({ config, headers, initialMapping, onChange, organizationId, previewData }: ImportStepMappingProps) {
    const t = useTranslations('ImportSystem.Mapping');
    // We use local state for immediate UI feedback, but sync to parent
    const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);
    const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);

    // Validate mapping
    const validate = (currentMapping: Record<string, string>) => {
        const isMissingRequired = config.columns
            .filter(c => c.required)
            .some(c => !Object.values(currentMapping).includes(c.id.toString()));
        return !isMissingRequired;
    };

    // Sync Helper
    const updateMapping = (newMapping: Record<string, string>) => {
        setMapping(newMapping);
        onChange(newMapping, validate(newMapping));
    };

    // Auto-map on load if not already mapped
    useEffect(() => {
        const loadPatterns = async () => {
            if (Object.keys(initialMapping).length > 0) {
                // Initial validation check for existing mapping
                onChange(initialMapping, validate(initialMapping));
                return;
            }

            setIsLoadingPatterns(true);
            try {
                // 1. Fetch learned patterns
                const learnedPatterns = await getMappingPatterns(organizationId, config.entityId);

                const newMapping: Record<string, string> = {};

                headers.forEach(header => {
                    // Strategy 1: Check Learned Patterns (High Priority)
                    if (learnedPatterns[header]) {
                        newMapping[header] = learnedPatterns[header];
                        return;
                    }

                    // Strategy 2: Fuzzy/Exact Match (Fallback)
                    const match = findBestMatch(header, config.columns);
                    if (match) {
                        newMapping[header] = match;
                    }
                });

                updateMapping(newMapping);
            } catch (error) {
                console.error("Failed to load mapping patterns", error);
                // Even on error, trigger update with empty/partial mapping
                updateMapping({});
            } finally {
                setIsLoadingPatterns(false);
            }
        };

        loadPatterns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    const handleMapChange = (header: string, columnId: string) => {
        const newMapping = {
            ...mapping,
            [header]: columnId
        };
        updateMapping(newMapping);
    };

    const isMissingRequired = !validate(mapping);

    // Helper to format values (especially Excel dates)
    const formatPreviewValue = (val: any): string => {
        if (val === null || val === undefined || val === "") return "";

        const strVal = String(val).trim();

        // Check if it looks like an Excel serial date (e.g. 45883 -> ~2025)
        // Range: 35000 (1995) to 60000 (2064) to avoid false positives with IDs/Amounts
        if (/^\d{5}$/.test(strVal)) {
            const num = parseInt(strVal);
            if (num > 35000 && num < 60000) {
                try {
                    const date = new Date((num - 25569) * 86400 * 1000);
                    // Check if valid date
                    if (!isNaN(date.getTime())) {
                        // Add a day to correct JS Date timezone offset usually
                        date.setSeconds(date.getSeconds() + 1);
                        return date.toLocaleDateString('es-ES');
                    }
                } catch (e) { /* ignore */ }
            }
        }

        return strVal;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full min-h-0 overflow-hidden"
        >
            <div className="flex-1 overflow-hidden flex flex-col">


                <div className="flex-1 border rounded-md bg-muted/10 overflow-hidden flex flex-col">
                    <div className="flex items-center bg-muted/50 px-4 py-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                        <div className="flex-1">{t('fileColumn')}</div>
                        <div className="flex-none px-4"><ArrowRight className="h-4 w-4 opacity-0" /></div>
                        <div className="flex-1">{t('systemField')}</div>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full">
                            <div className="divide-y relative">
                                {headers.map((header) => {
                                    const mappedColId = mapping[header];
                                    const rawValue = previewData ? previewData[header] : "";
                                    const formattedValue = formatPreviewValue(rawValue);

                                    return (
                                        <div key={header} className="flex items-center px-4 py-3 group hover:bg-muted/30 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-medium truncate text-sm" title={header}>{header}</span>
                                                    {formattedValue && (
                                                        <span className="text-xs text-muted-foreground/80 truncate font-mono flex items-center gap-1" title={formattedValue}>
                                                            <span className="opacity-50 font-sans">Tu valor:</span>
                                                            <span className="font-medium text-foreground/80">
                                                                {formattedValue.length > 30 ? formattedValue.substring(0, 30) + "..." : formattedValue}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-none px-4 text-muted-foreground">
                                                <ArrowRightLeft className="h-4 w-4" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <Select
                                                    value={mappedColId || "ignore"}
                                                    onValueChange={(val) => handleMapChange(header, val === "ignore" ? "" : val)}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-9 w-full",
                                                        !mappedColId && "text-muted-foreground border-dashed bg-transparent"
                                                    )}>
                                                        <SelectValue placeholder={t('ignoreColumn')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ignore" className="text-muted-foreground italic">
                                                            {t('ignoreColumn')}
                                                        </SelectItem>
                                                        {config.columns.map((col) => {
                                                            const isMappedElsewhere = Object.entries(mapping).some(
                                                                ([h, id]) => id === col.id.toString() && h !== header
                                                            );
                                                            return (
                                                                <SelectItem
                                                                    key={col.id.toString()}
                                                                    value={col.id.toString()}
                                                                    disabled={isMappedElsewhere}
                                                                >
                                                                    <span>
                                                                        {col.label}
                                                                        {col.required && (
                                                                            <span className="ml-2 text-primary font-medium text-xs">
                                                                                * ({t('required')})
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

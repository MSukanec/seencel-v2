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
}

export function ImportStepMapping({ config, headers, initialMapping, onChange, organizationId }: ImportStepMappingProps) {
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

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full overflow-hidden"
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
                                    return (
                                        <div key={header} className="flex items-center px-4 py-3 group hover:bg-muted/30 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium truncate" title={header}>{header}</span>
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

            <div className="py-4 pt-2 shrink-0">
                <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded-md border flex justify-center">
                    {!isMissingRequired
                        ? <span className="text-green-600 flex items-center gap-1.5 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> {t('status.allMapped')}</span>
                        : <span className="text-amber-600 flex items-center gap-1.5 font-medium"><div className="h-2 w-2 rounded-full bg-amber-500" /> {t('status.missing')}</span>
                    }
                </div>
            </div>
        </motion.div>
    );
}


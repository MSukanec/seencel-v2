"use client";

import { useModal } from "@/stores/modal-store";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportConfig } from "@/lib/import-utils";
import { BulkImportModal } from "../import/import-modal";

interface DataTableImportProps<T> {
    config: ImportConfig<T>;
    organizationId: string;
}

export function DataTableImport<T>({ config, organizationId }: DataTableImportProps<T>) {
    const { openModal } = useModal();

    const handleOpenImport = () => {
        openModal(
            <BulkImportModal config={config} organizationId={organizationId} />,
            {
                size: "2xl",
                title: `Importar ${config.entityLabel}`,
                description: "Sigue los pasos para importar datos masivamente."
            }
        );
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="hidden h-9 lg:flex"
            onClick={handleOpenImport}
        >
            <Upload className="mr-2 h-4 w-4" />
            Importar
        </Button>
    );
}


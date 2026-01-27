"use client";

import type { ReportBlock } from "../views/reports-builder-view";
import { KpiBlock } from "./blocks/kpi-block";
import { ChartBlock } from "./blocks/chart-block";
import { TableBlock } from "./blocks/table-block";
import { TextBlock } from "./blocks/text-block";
import { ImageBlock } from "./blocks/image-block";
import { ProjectSummaryBlock } from "./blocks/project-summary-block";
import { FinancialSummaryBlock } from "./blocks/financial-summary-block";
import { TaskProgressBlock } from "./blocks/task-progress-block";

interface BlockRendererProps {
    block: ReportBlock;
    organizationId: string;
    projects: { id: string; name: string; status: string }[];
}

export function BlockRenderer({ block, organizationId, projects }: BlockRendererProps) {
    const { type, config } = block;

    switch (type) {
        case "kpi":
            return <KpiBlock config={config} />;

        case "chart-line":
        case "chart-bar":
        case "chart-pie":
            return <ChartBlock type={type} config={config} organizationId={organizationId} />;

        case "table":
            return <TableBlock config={config} organizationId={organizationId} projects={projects} />;

        case "text":
            return <TextBlock config={config} />;

        case "image":
            return <ImageBlock config={config} />;

        case "project-summary":
            return <ProjectSummaryBlock config={config} projects={projects} />;

        case "financial-summary":
            return <FinancialSummaryBlock config={config} organizationId={organizationId} />;

        case "task-progress":
            return <TaskProgressBlock config={config} organizationId={organizationId} />;

        default:
            return (
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg text-center text-muted-foreground text-sm">
                    Bloque no reconocido: {type}
                </div>
            );
    }
}

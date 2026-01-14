"use client";

import { Badge } from "@/components/ui/badge";
import {
    Activity,
    CheckCircle,
    Clock,
    CircleOff
} from "lucide-react";
import { useTranslations } from "next-intl";

// Valid enum values from database
type ProjectStatus = 'active' | 'completed' | 'planning' | 'inactive';

interface ProjectStatusBadgeProps {
    status: string;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
    const t = useTranslations('Project.status');
    const statusKey = (status?.toLowerCase() || 'active') as ProjectStatus;

    // Map status to badge variant and icon
    let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "system" = "system";
    let Icon = Activity;

    switch (statusKey) {
        case 'active':
            variant = "success";
            Icon = Activity;
            break;
        case 'completed':
            variant = "info";
            Icon = CheckCircle;
            break;
        case 'planning':
            variant = "warning";
            Icon = Clock;
            break;
        case 'inactive':
            variant = "system";
            Icon = CircleOff;
            break;
        default:
            variant = "secondary";
            Icon = Activity;
    }

    // Get translated label (fallback to status if translation missing)
    const label = t(statusKey) || status;

    return (
        <Badge variant={variant} icon={<Icon className="h-3.5 w-3.5" />}>
            {label}
        </Badge>
    );
}

import { ReactNode } from "react";

export type WidgetSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall';

export interface WidgetDefinition {
    id: string;
    name: string;
    description?: string;
    component: React.ComponentType<any>;
    defaultSize: WidgetSize;
    category: 'financial' | 'operational' | 'analytics';
    icon?: ReactNode;
}

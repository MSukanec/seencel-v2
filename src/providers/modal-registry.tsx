import React from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const ProjectTypeForm = dynamic(() => import('@/features/projects/components/ProjectTypeForm').then(mod => mod.ProjectTypeForm));
const ProjectModalityForm = dynamic(() => import('@/features/projects/components/ProjectModalityForm').then(mod => mod.ProjectModalityForm));
const ProjectForm = dynamic(() => import('@/features/projects/components/ProjectForm').then(mod => mod.ProjectForm));

export interface ModalRegistryItem {
    component: React.ComponentType<any>;
    defaultOptions?: {
        title?: string;
        description?: string;
        size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    };
}

export const MODAL_REGISTRY: Record<string, ModalRegistryItem> = {
    'create-project': {
        component: ProjectForm,
        defaultOptions: {
            title: 'Nuevo Proyecto',
            description: 'Completa la información para crear un proyecto.',
            size: 'md'
        }
    },
    'create-project-type': {
        component: ProjectTypeForm,
        defaultOptions: {
            title: 'Nuevo Tipo de Proyecto',
            size: 'sm'
        }
    },
    'create-project-modality': {
        component: ProjectModalityForm,
        defaultOptions: {
            title: 'Nueva Modalidad',
            size: 'sm'
        }
    }
    // Add more mappings here
};

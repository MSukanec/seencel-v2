import React from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const ProjectsTypeForm = dynamic(() => import('@/features/projects/forms/projects-type-form').then(mod => mod.ProjectsTypeForm));
const ProjectsModalityForm = dynamic(() => import('@/features/projects/forms/projects-modality-form').then(mod => mod.ProjectsModalityForm));
const ProjectsProjectForm = dynamic(() => import('@/features/projects/forms/projects-project-form').then(mod => mod.ProjectsProjectForm));

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
        component: ProjectsProjectForm,
        defaultOptions: {
            title: 'Nuevo Proyecto',
            description: 'Completa la información para crear un proyecto.',
            size: 'md'
        }
    },
    'create-project-type': {
        component: ProjectsTypeForm,
        defaultOptions: {
            title: 'Nuevo Tipo de Proyecto',
            size: 'sm'
        }
    },
    'create-project-modality': {
        component: ProjectsModalityForm,
        defaultOptions: {
            title: 'Nueva Modalidad',
            size: 'sm'
        }
    }
    // Add more mappings here
};


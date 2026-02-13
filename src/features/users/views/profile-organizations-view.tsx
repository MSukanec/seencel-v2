"use client";

// ============================================================================
// PROFILE ORGANIZATIONS VIEW
// ============================================================================
// Vista de organizaciones del usuario usando SettingsSection layout.
// ============================================================================

import { Building, Plus } from "lucide-react";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { OrganizationsList } from "@/features/organization/components/organizations-list";
import { useModal } from "@/stores/modal-store";
import { OrganizationCreateForm } from "@/features/organization/forms/organization-create-form";
import { useTranslations } from "next-intl";

interface Organization {
    id: string;
    name: string;
    logo_url?: string | null;
    owner_id?: string | null;
    slug?: string;
    role?: string;
    plans?: {
        id: string;
        name: string;
        slug: string;
    } | null;
    members?: {
        name: string;
        image?: string | null;
        email?: string;
    }[];
}

interface ProfileOrganizationsViewProps {
    organizations: Organization[];
    activeOrgId: string | null;
    currentUserId: string;
}

export function ProfileOrganizationsView({ organizations, activeOrgId, currentUserId }: ProfileOrganizationsViewProps) {
    const t = useTranslations('Settings.Organization');
    const { openModal } = useModal();

    const handleCreate = () => {
        openModal(
            <OrganizationCreateForm />,
            {
                title: "Crear nueva organización",
                description: "Creá una nueva organización para gestionar proyectos independientes con su propio equipo y configuración.",
                size: "md",
            }
        );
    };

    return (
        <ContentLayout variant="settings">
            <SettingsSectionContainer>
                <SettingsSection
                    icon={Building}
                    title={t('title')}
                    description={t('description')}
                    actions={[
                        {
                            label: "Crear Organización",
                            icon: Plus,
                            onClick: handleCreate,
                        },
                    ]}
                >
                    {organizations.length === 0 ? (
                        <div className="rounded-xl border border-dashed bg-muted/50 p-8 text-center">
                            <Building className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-30" />
                            <p className="text-sm text-muted-foreground">{t('notFound')}</p>
                        </div>
                    ) : (
                        <OrganizationsList
                            organizations={organizations}
                            activeOrgId={activeOrgId}
                            currentUserId={currentUserId}
                        />
                    )}
                </SettingsSection>
            </SettingsSectionContainer>
        </ContentLayout>
    );
}

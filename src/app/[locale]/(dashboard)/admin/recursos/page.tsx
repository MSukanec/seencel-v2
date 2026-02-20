import type { Metadata } from "next";
import { getSystemMaterials, getAllMaterialsAdmin, getMaterialCategories, getUnitsForMaterials, getMaterialCategoriesHierarchy, getSystemLaborCategories, getSystemLaborLevels, getSystemLaborRoles, getSystemLaborTypes, getUnitsForLabor, getSystemUnits, getSystemUnitCategories } from "@/features/admin/queries";
import { MaterialsCatalogView } from "@/features/materials/views/materials-catalog-view";
import { LaborCatalogView } from "@/features/labor/views/labor-catalog-view";
import { UnitsCatalogView } from "@/features/units/views/units-catalog-view";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Shield, Package, HardHat, Ruler, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Admin - Recursos | Seencel`,
        description: "Gestión de materiales, mano de obra y unidades del catálogo técnico.",
        robots: "noindex, nofollow",
    };
}

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

// ============================================================================
// Page Component
// ============================================================================

export default async function AdminRecursosPage() {
    try {
        const [
            systemMaterials,
            allMaterials,
            materialCategories,
            materialUnits,
            categoryHierarchy,
            systemLaborCategories,
            systemLaborLevels,
            systemLaborRoles,
            systemLaborTypes,
            laborUnits,
            systemUnits,
            systemUnitCategories
        ] = await Promise.all([
            getSystemMaterials(),
            getAllMaterialsAdmin(),
            getMaterialCategories(),
            getUnitsForMaterials(),
            getMaterialCategoriesHierarchy(),
            getSystemLaborCategories(),
            getSystemLaborLevels(),
            getSystemLaborRoles(),
            getSystemLaborTypes(),
            getUnitsForLabor(),
            getSystemUnits(),
            getSystemUnitCategories()
        ]);

        // Transform system materials
        const materialsForView = systemMaterials.map(m => ({
            ...m,
            organization_id: null as string | null
        }));

        // Transform categories
        const categoriesForView = materialCategories.map(c => ({
            ...c,
            name: c.name || '',
            parent_id: null as string | null
        }));

        // Transform units (preserve symbol and applicable_to for MaterialForm filtering)
        const unitsForView = materialUnits.map(u => ({
            id: u.id,
            name: u.name,
            abbreviation: u.symbol || '',
            symbol: u.symbol || null,
            applicable_to: u.applicable_to || [],
        }));

        // Transform category hierarchy
        const categoryHierarchyForView = categoryHierarchy.map(c => ({
            ...c,
            name: c.name || ''
        }));

        return (
            <Tabs defaultValue="materials" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Recursos"
                    icon={<Layers />}
                    actions={
                        <Badge variant="destructive" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Modo Admin
                        </Badge>
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                            <TabsTrigger value="materials" className={tabTriggerClass}>
                                <Package className="h-4 w-4 mr-2" />
                                Materiales
                            </TabsTrigger>
                            <TabsTrigger value="labor" className={tabTriggerClass}>
                                <HardHat className="h-4 w-4 mr-2" />
                                Mano de Obra
                            </TabsTrigger>
                            <TabsTrigger value="units" className={tabTriggerClass}>
                                <Ruler className="h-4 w-4 mr-2" />
                                Unidades
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="materials" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <MaterialsCatalogView
                            materials={materialsForView}
                            allMaterials={allMaterials}
                            units={unitsForView}
                            categories={categoriesForView}
                            categoryHierarchy={categoryHierarchyForView}
                            orgId="" // No org - admin mode
                            isAdminMode={true}
                        />
                    </TabsContent>

                    <TabsContent value="labor" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <LaborCatalogView
                                laborCategories={systemLaborCategories}
                                laborLevels={systemLaborLevels}
                                laborRoles={systemLaborRoles}
                                laborTypes={systemLaborTypes}
                                units={laborUnits}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="units" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <UnitsCatalogView
                                units={systemUnits}
                                categories={systemUnitCategories}
                                orgId=""
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar recursos"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}

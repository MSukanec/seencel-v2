// Layout Components - Main Export
// Organized into public (landing, auth) and dashboard (app) layouts

// Public layout components
export * from "./public";

// Dashboard layout components
export * from "./dashboard";

// Explicit exports for backward compatibility
export { Header } from "./dashboard/mega-menu/header";
export { HeaderPortal } from "./dashboard/mega-menu/header-portal";
export { LayoutSwitcher } from "./dashboard/shared/layout-switcher";
export { PageWrapper } from "./dashboard/shared/page-wrapper";
export { ContentLayout } from "./dashboard/shared/content-layout";
export { SidebarLayout } from "./dashboard/sidebar/sidebar-layout";

// Shared dashboard components
export { GlobalDrawer } from "./dashboard/shared/drawer/global-drawer";
export { HeaderTitleUpdater } from "./dashboard/shared/header-title-updater";

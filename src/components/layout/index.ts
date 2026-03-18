// Layout Components - Main Export
// Organized into public (landing, auth) and dashboard (app) layouts

// Public layout components
export * from "./public";

// Dashboard layout components
export * from "./dashboard";

// Explicit exports for backward compatibility
export { Header } from "./public/header";
export { LayoutSwitcher } from "./dashboard/shell/layout-switcher";
export { PageWrapper } from "./dashboard/shell/page-wrapper";
export { ContentLayout } from "./dashboard/shell/content-layout";
export { SidebarLayout } from "./dashboard/sidebar/sidebar-layout";

// Shared dashboard components
export { PageHeaderActionPortal } from "./dashboard/header/page-header";

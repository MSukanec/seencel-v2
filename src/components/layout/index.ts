// Layout Components - Main Export
// Organized into public (landing, auth) and dashboard (app) layouts

// Public layout components
export * from "./public";

// Dashboard layout components
export * from "./dashboard";

// Explicit exports for backward compatibility
export { Header } from "./public/header";
export { DashboardShell } from "./dashboard/dashboard-shell";
export { PageWrapper } from "./page/page-wrapper";
export type { RouteTab } from "./page/page-wrapper";
export { ContentLayout } from "./page/content-layout";
export * from "./page/split-editor-layout";
export { SidebarLayout } from "./dashboard/sidebar/sidebar-layout";

// Shared dashboard components
export { PageHeaderActionPortal } from "./dashboard/header/page-header";
export { PageIntro } from "../shared/page-intro";

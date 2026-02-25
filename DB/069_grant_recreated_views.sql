-- ============================================================
-- 069: GRANT SELECT on ALL views across ALL non-public schemas
-- ============================================================
-- Después de migrar tablas/vistas a schemas dedicados,
-- las vistas recreadas con DROP+CREATE perdieron los GRANTs.
-- Error: 42501 - permission denied for view X
--
-- Nombres extraídos directamente del introspector (views.md).
-- ============================================================

-- ============================
-- GRANT USAGE on schemas (prerequisite)
-- ============================
GRANT USAGE ON SCHEMA academy TO authenticated, service_role;
GRANT USAGE ON SCHEMA audit TO authenticated, service_role;
GRANT USAGE ON SCHEMA catalog TO authenticated, service_role;
GRANT USAGE ON SCHEMA construction TO authenticated, service_role;
GRANT USAGE ON SCHEMA contacts TO authenticated, service_role;
GRANT USAGE ON SCHEMA finance TO authenticated, service_role;
GRANT USAGE ON SCHEMA iam TO authenticated, service_role;
GRANT USAGE ON SCHEMA ops TO authenticated, service_role;
GRANT USAGE ON SCHEMA planner TO authenticated, service_role;
GRANT USAGE ON SCHEMA projects TO authenticated, service_role;

-- ============================
-- ACADEMY (7 views)
-- ============================
GRANT SELECT ON academy.course_lesson_completions_view TO authenticated, service_role;
GRANT SELECT ON academy.course_lessons_total_view TO authenticated, service_role;
GRANT SELECT ON academy.course_progress_view TO authenticated, service_role;
GRANT SELECT ON academy.course_user_active_days_view TO authenticated, service_role;
GRANT SELECT ON academy.course_user_course_done_view TO authenticated, service_role;
GRANT SELECT ON academy.course_user_global_progress_view TO authenticated, service_role;
GRANT SELECT ON academy.course_user_study_time_view TO authenticated, service_role;

-- ============================
-- AUDIT (1 view)
-- ============================
GRANT SELECT ON audit.organization_activity_logs_view TO authenticated, service_role;

-- ============================
-- CATALOG (6 views)
-- ============================
GRANT SELECT ON catalog.labor_view TO authenticated, service_role;
GRANT SELECT ON catalog.materials_view TO authenticated, service_role;
GRANT SELECT ON catalog.organization_task_prices_view TO authenticated, service_role;
GRANT SELECT ON catalog.task_costs_view TO authenticated, service_role;
GRANT SELECT ON catalog.task_recipes_view TO authenticated, service_role;
GRANT SELECT ON catalog.tasks_view TO authenticated, service_role;

-- ============================
-- CONSTRUCTION (3 views)
-- ============================
GRANT SELECT ON construction.construction_tasks_view TO authenticated, service_role;
GRANT SELECT ON construction.labor_insurance_view TO authenticated, service_role;
GRANT SELECT ON construction.project_material_requirements_view TO authenticated, service_role;

-- ============================
-- CONTACTS (1 view)
-- ============================
GRANT SELECT ON contacts.contacts_view TO authenticated, service_role;

-- ============================
-- FINANCE (24 views)
-- ============================
GRANT SELECT ON finance.capital_ledger_view TO authenticated, service_role;
GRANT SELECT ON finance.capital_organization_totals_view TO authenticated, service_role;
GRANT SELECT ON finance.capital_participants_summary_view TO authenticated, service_role;
GRANT SELECT ON finance.capital_partner_balances_view TO authenticated, service_role;
GRANT SELECT ON finance.capital_partner_kpi_view TO authenticated, service_role;
GRANT SELECT ON finance.client_financial_summary_view TO authenticated, service_role;
GRANT SELECT ON finance.client_payments_view TO authenticated, service_role;
GRANT SELECT ON finance.contract_summary_view TO authenticated, service_role;
GRANT SELECT ON finance.general_costs_by_category_view TO authenticated, service_role;
GRANT SELECT ON finance.general_costs_monthly_summary_view TO authenticated, service_role;
GRANT SELECT ON finance.general_costs_payments_view TO authenticated, service_role;
GRANT SELECT ON finance.labor_by_type_view TO authenticated, service_role;
GRANT SELECT ON finance.labor_monthly_summary_view TO authenticated, service_role;
GRANT SELECT ON finance.labor_payments_view TO authenticated, service_role;
GRANT SELECT ON finance.material_invoices_view TO authenticated, service_role;
GRANT SELECT ON finance.material_payments_view TO authenticated, service_role;
GRANT SELECT ON finance.material_purchase_orders_view TO authenticated, service_role;
GRANT SELECT ON finance.organization_currencies_view TO authenticated, service_role;
GRANT SELECT ON finance.organization_wallets_view TO authenticated, service_role;
GRANT SELECT ON finance.quotes_items_view TO authenticated, service_role;
GRANT SELECT ON finance.quotes_view TO authenticated, service_role;
GRANT SELECT ON finance.subcontract_payments_view TO authenticated, service_role;
GRANT SELECT ON finance.subcontracts_view TO authenticated, service_role;
GRANT SELECT ON finance.unified_financial_movements_view TO authenticated, service_role;

-- ============================
-- IAM (6 views)
-- ============================
GRANT SELECT ON iam.admin_organizations_view TO authenticated, service_role;
GRANT SELECT ON iam.admin_users_view TO authenticated, service_role;
GRANT SELECT ON iam.organization_member_details TO authenticated, service_role;
GRANT SELECT ON iam.organization_members_full_view TO authenticated, service_role;
GRANT SELECT ON iam.organization_online_users TO authenticated, service_role;
GRANT SELECT ON iam.users_public_profile_view TO authenticated, service_role;

-- ============================
-- OPS (14 views)
-- ============================
GRANT SELECT ON ops.analytics_at_risk_users_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_bounce_rate_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_general_kpis_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_hourly_activity_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_page_engagement_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_realtime_overview_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_session_duration_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_top_users_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_user_growth_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_user_journeys_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_user_session_summary_view TO authenticated, service_role;
GRANT SELECT ON ops.analytics_users_by_country_view TO authenticated, service_role;
GRANT SELECT ON ops.ops_alerts_enriched_view TO authenticated, service_role;
GRANT SELECT ON ops.system_errors_enriched_view TO authenticated, service_role;

-- ============================
-- PLANNER (2 views)
-- ============================
GRANT SELECT ON planner.boards_view TO authenticated, service_role;
GRANT SELECT ON planner.items_view TO authenticated, service_role;

-- ============================
-- PROJECTS (4 views)
-- ============================
GRANT SELECT ON projects.project_access_view TO authenticated, service_role;
GRANT SELECT ON projects.project_clients_view TO authenticated, service_role;
GRANT SELECT ON projects.project_labor_view TO authenticated, service_role;
GRANT SELECT ON projects.projects_view TO authenticated, service_role;

-- ============================================================
-- Después de ejecutar:
-- NOTIFY pgrst, 'reload schema';
-- ============================================================

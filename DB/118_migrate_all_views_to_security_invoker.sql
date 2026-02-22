-- =============================================================================
-- 118: MIGRATE ALL VIEWS TO SECURITY INVOKER
-- =============================================================================
-- Changes ALL 66 DEFINER views to SECURITY INVOKER.
-- Using ALTER VIEW (not DROP+CREATE) to PRESERVE existing GRANTs.
--
-- SECURITY INVOKER means the view respects the RLS policies of the
-- underlying tables, running queries as the calling user (not the owner).
-- This ensures proper org-level isolation.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- ACADEMY (7 views)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW academy.course_lesson_completions_view SET (security_invoker = true);
ALTER VIEW academy.course_lessons_total_view SET (security_invoker = true);
ALTER VIEW academy.course_progress_view SET (security_invoker = true);
ALTER VIEW academy.course_user_active_days_view SET (security_invoker = true);
ALTER VIEW academy.course_user_course_done_view SET (security_invoker = true);
ALTER VIEW academy.course_user_global_progress_view SET (security_invoker = true);
ALTER VIEW academy.course_user_study_time_view SET (security_invoker = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT (1 view)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW audit.organization_activity_logs_view SET (security_invoker = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- CATALOG (6 views)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW catalog.labor_view SET (security_invoker = true);
ALTER VIEW catalog.materials_view SET (security_invoker = true);
ALTER VIEW catalog.organization_task_prices_view SET (security_invoker = true);
ALTER VIEW catalog.task_costs_view SET (security_invoker = true);
ALTER VIEW catalog.task_recipes_view SET (security_invoker = true);
ALTER VIEW catalog.tasks_view SET (security_invoker = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONSTRUCTION (5 views)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW construction.construction_tasks_view SET (security_invoker = true);
ALTER VIEW construction.contract_summary_view SET (security_invoker = true);
ALTER VIEW construction.labor_insurance_view SET (security_invoker = true);
ALTER VIEW construction.project_material_requirements_view SET (security_invoker = true);
ALTER VIEW construction.quotes_view SET (security_invoker = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- FINANCE (22 views)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW finance.capital_ledger_view SET (security_invoker = true);
ALTER VIEW finance.capital_organization_totals_view SET (security_invoker = true);
ALTER VIEW finance.capital_participants_summary_view SET (security_invoker = true);
ALTER VIEW finance.capital_partner_balances_view SET (security_invoker = true);
ALTER VIEW finance.capital_partner_kpi_view SET (security_invoker = true);
ALTER VIEW finance.client_financial_summary_view SET (security_invoker = true);
ALTER VIEW finance.client_payments_view SET (security_invoker = true);
ALTER VIEW finance.general_costs_by_category_view SET (security_invoker = true);
ALTER VIEW finance.general_costs_monthly_summary_view SET (security_invoker = true);
ALTER VIEW finance.general_costs_payments_view SET (security_invoker = true);
ALTER VIEW finance.labor_by_type_view SET (security_invoker = true);
ALTER VIEW finance.labor_monthly_summary_view SET (security_invoker = true);
ALTER VIEW finance.labor_payments_view SET (security_invoker = true);
ALTER VIEW finance.material_invoices_view SET (security_invoker = true);
ALTER VIEW finance.material_payments_view SET (security_invoker = true);
ALTER VIEW finance.material_purchase_orders_view SET (security_invoker = true);
ALTER VIEW finance.organization_currencies_view SET (security_invoker = true);
ALTER VIEW finance.organization_wallets_view SET (security_invoker = true);
ALTER VIEW finance.quotes_items_view SET (security_invoker = true);
ALTER VIEW finance.subcontract_payments_view SET (security_invoker = true);
ALTER VIEW finance.subcontracts_view SET (security_invoker = true);
ALTER VIEW finance.unified_financial_movements_view SET (security_invoker = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- IAM (6 views — includes admin views, all get INVOKER for consistency)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW iam.admin_organizations_view SET (security_invoker = true);
ALTER VIEW iam.admin_users_view SET (security_invoker = true);
ALTER VIEW iam.organization_member_details SET (security_invoker = true);
ALTER VIEW iam.organization_members_full_view SET (security_invoker = true);
ALTER VIEW iam.organization_online_users SET (security_invoker = true);
ALTER VIEW iam.users_public_profile_view SET (security_invoker = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- OPS (14 views — admin analytics, INVOKER for consistency)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW ops.analytics_at_risk_users_view SET (security_invoker = true);
ALTER VIEW ops.analytics_bounce_rate_view SET (security_invoker = true);
ALTER VIEW ops.analytics_general_kpis_view SET (security_invoker = true);
ALTER VIEW ops.analytics_hourly_activity_view SET (security_invoker = true);
ALTER VIEW ops.analytics_page_engagement_view SET (security_invoker = true);
ALTER VIEW ops.analytics_realtime_overview_view SET (security_invoker = true);
ALTER VIEW ops.analytics_session_duration_view SET (security_invoker = true);
ALTER VIEW ops.analytics_top_users_view SET (security_invoker = true);
ALTER VIEW ops.analytics_user_growth_view SET (security_invoker = true);
ALTER VIEW ops.analytics_user_journeys_view SET (security_invoker = true);
ALTER VIEW ops.analytics_user_session_summary_view SET (security_invoker = true);
ALTER VIEW ops.analytics_users_by_country_view SET (security_invoker = true);
ALTER VIEW ops.ops_alerts_enriched_view SET (security_invoker = true);
ALTER VIEW ops.system_errors_enriched_view SET (security_invoker = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- PLANNER (2 views)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW planner.boards_view SET (security_invoker = true);
ALTER VIEW planner.items_view SET (security_invoker = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROJECTS (3 views — projects_view already INVOKER, skip it)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER VIEW projects.project_access_view SET (security_invoker = true);
ALTER VIEW projects.project_clients_view SET (security_invoker = true);
ALTER VIEW projects.project_labor_view SET (security_invoker = true);

COMMIT;

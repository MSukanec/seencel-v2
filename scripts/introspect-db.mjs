/**
 * Database Schema Introspection Script
 * =====================================
 * Connects to Supabase PostgreSQL (READ-ONLY queries) and generates
 * a comprehensive DB/SCHEMA.md with all tables, columns, functions,
 * triggers, RLS policies, and views.
 *
 * Usage: node scripts/introspect-db.mjs
 * Or:    npm run db:schema
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
}

const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function main() {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected! Introspecting schema...\n');

    const sections = [];

    // Header
    sections.push(`# Database Schema (Auto-generated)`);
    sections.push(`> Generated: ${new Date().toISOString()}`);
    sections.push(`> Source: Supabase PostgreSQL (read-only introspection)`);
    sections.push(`> ⚠️ This file is auto-generated. Do NOT edit manually.\n`);

    // ── 1. TABLES + COLUMNS ──
    console.log('📋 Fetching tables and columns...');
    const tablesRes = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    `);

    const columnsRes = await client.query(`
        SELECT
            c.table_name,
            c.column_name,
            c.data_type,
            c.udt_name,
            c.column_default,
            c.is_nullable,
            c.character_maximum_length,
            c.numeric_precision
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        ORDER BY c.table_name, c.ordinal_position;
    `);

    // Group columns by table
    const columnsByTable = {};
    for (const col of columnsRes.rows) {
        if (!columnsByTable[col.table_name]) columnsByTable[col.table_name] = [];
        columnsByTable[col.table_name].push(col);
    }

    // ── 1b. PRIMARY KEYS ──
    const pkRes = await client.query(`
        SELECT
            tc.table_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.ordinal_position;
    `);

    const pkByTable = {};
    for (const pk of pkRes.rows) {
        if (!pkByTable[pk.table_name]) pkByTable[pk.table_name] = new Set();
        pkByTable[pk.table_name].add(pk.column_name);
    }

    // ── 1c. FOREIGN KEYS ──
    console.log('🔗 Fetching foreign keys...');
    const fkRes = await client.query(`
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name;
    `);

    const fkByTable = {};
    for (const fk of fkRes.rows) {
        if (!fkByTable[fk.table_name]) fkByTable[fk.table_name] = [];
        fkByTable[fk.table_name].push(fk);
    }

    // ── 1d. UNIQUE CONSTRAINTS ──
    const uniqueRes = await client.query(`
        SELECT
            tc.table_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name;
    `);

    const uniqueByTable = {};
    for (const u of uniqueRes.rows) {
        if (!uniqueByTable[u.table_name]) uniqueByTable[u.table_name] = new Set();
        uniqueByTable[u.table_name].add(u.column_name);
    }

    // Build tables section
    sections.push(`## Tables (${tablesRes.rows.length})\n`);

    for (const table of tablesRes.rows) {
        const name = table.table_name;
        const cols = columnsByTable[name] || [];
        const pks = pkByTable[name] || new Set();
        const fks = fkByTable[name] || [];
        const uniques = uniqueByTable[name] || new Set();

        sections.push(`### \`${name}\`\n`);
        sections.push(`| Column | Type | Nullable | Default | Constraints |`);
        sections.push(`|--------|------|----------|---------|-------------|`);

        for (const col of cols) {
            const type = col.character_maximum_length
                ? `${col.udt_name}(${col.character_maximum_length})`
                : col.udt_name;
            const nullable = col.is_nullable === 'YES' ? '✓' : '✗';
            const def = col.column_default
                ? col.column_default.length > 40
                    ? col.column_default.substring(0, 37) + '...'
                    : col.column_default
                : '';

            const constraints = [];
            if (pks.has(col.column_name)) constraints.push('PK');
            if (uniques.has(col.column_name)) constraints.push('UNIQUE');
            const fk = fks.find(f => f.column_name === col.column_name);
            if (fk) constraints.push(`FK → ${fk.foreign_table}.${fk.foreign_column}`);

            sections.push(`| ${col.column_name} | ${type} | ${nullable} | ${def} | ${constraints.join(', ')} |`);
        }
        sections.push('');
    }

    // ── 2. VIEWS ──
    console.log('👁️ Fetching views...');
    const viewsRes = await client.query(`
        SELECT table_name, view_definition
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `);

    if (viewsRes.rows.length > 0) {
        sections.push(`---\n## Views (${viewsRes.rows.length})\n`);
        for (const view of viewsRes.rows) {
            sections.push(`### \`${view.table_name}\`\n`);
            sections.push('```sql');
            sections.push(view.view_definition?.trim() || '-- (definition not available)');
            sections.push('```\n');
        }
    }

    // ── 3. FUNCTIONS ──
    console.log('⚙️ Fetching functions...');
    const funcsRes = await client.query(`
        SELECT
            p.proname AS name,
            pg_get_function_arguments(p.oid) AS args,
            pg_get_function_result(p.oid) AS return_type,
            CASE p.prokind
                WHEN 'f' THEN 'function'
                WHEN 'p' THEN 'procedure'
            END AS kind,
            CASE p.provolatile
                WHEN 'i' THEN 'IMMUTABLE'
                WHEN 's' THEN 'STABLE'
                WHEN 'v' THEN 'VOLATILE'
            END AS volatility,
            CASE p.prosecdef
                WHEN true THEN 'SECURITY DEFINER'
                ELSE 'SECURITY INVOKER'
            END AS security,
            pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prokind IN ('f', 'p')
        ORDER BY p.proname;
    `);

    if (funcsRes.rows.length > 0) {
        sections.push(`---\n## Functions & Procedures (${funcsRes.rows.length})\n`);
        for (const fn of funcsRes.rows) {
            const badge = fn.security === 'SECURITY DEFINER' ? ' 🔐' : '';
            sections.push(`### \`${fn.name}(${fn.args})\`${badge}\n`);
            sections.push(`- **Returns**: ${fn.return_type}`);
            sections.push(`- **Kind**: ${fn.kind} | ${fn.volatility} | ${fn.security}\n`);
            sections.push('<details><summary>Source</summary>\n');
            sections.push('```sql');
            sections.push(fn.definition?.trim() || '-- (source not available)');
            sections.push('```\n</details>\n');
        }
    }

    // ── 4. TRIGGERS ──
    console.log('⚡ Fetching triggers...');
    const triggersRes = await client.query(`
        SELECT
            trigger_name,
            event_object_table AS table_name,
            event_manipulation AS event,
            action_timing AS timing,
            action_statement
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name;
    `);

    if (triggersRes.rows.length > 0) {
        // Deduplicate (triggers appear once per event type)
        const seen = new Set();
        const uniqueTriggers = triggersRes.rows.filter(t => {
            const key = `${t.table_name}.${t.trigger_name}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Group events for same trigger
        const triggerEvents = {};
        for (const t of triggersRes.rows) {
            const key = `${t.table_name}.${t.trigger_name}`;
            if (!triggerEvents[key]) triggerEvents[key] = { ...t, events: [] };
            triggerEvents[key].events.push(t.event);
        }

        sections.push(`---\n## Triggers (${Object.keys(triggerEvents).length})\n`);
        sections.push(`| Table | Trigger | Timing | Events | Action |`);
        sections.push(`|-------|---------|--------|--------|--------|`);

        for (const t of Object.values(triggerEvents)) {
            const action = t.action_statement.length > 60
                ? t.action_statement.substring(0, 57) + '...'
                : t.action_statement;
            sections.push(`| ${t.table_name} | ${t.trigger_name} | ${t.timing} | ${t.events.join(', ')} | ${action} |`);
        }
        sections.push('');
    }

    // ── 5. RLS POLICIES ──
    console.log('🛡️ Fetching RLS policies...');
    const rlsRes = await client.query(`
        SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
    `);

    if (rlsRes.rows.length > 0) {
        // Group by table
        const rlsByTable = {};
        for (const p of rlsRes.rows) {
            if (!rlsByTable[p.tablename]) rlsByTable[p.tablename] = [];
            rlsByTable[p.tablename].push(p);
        }

        sections.push(`---\n## RLS Policies (${rlsRes.rows.length})\n`);

        for (const [table, policies] of Object.entries(rlsByTable)) {
            sections.push(`### \`${table}\` (${policies.length} policies)\n`);
            for (const p of policies) {
                sections.push(`#### ${p.policyname}\n`);
                sections.push(`- **Command**: ${p.cmd} | **Permissive**: ${p.permissive}`);
                sections.push(`- **Roles**: ${p.roles}`);
                if (p.qual) {
                    sections.push(`- **USING**:`);
                    sections.push('```sql');
                    sections.push(p.qual);
                    sections.push('```');
                }
                if (p.with_check) {
                    sections.push(`- **WITH CHECK**:`);
                    sections.push('```sql');
                    sections.push(p.with_check);
                    sections.push('```');
                }
                sections.push('');
            }
        }
    }

    // ── 6. ENUMS ──
    console.log('📦 Fetching enums...');
    const enumsRes = await client.query(`
        SELECT
            t.typname AS enum_name,
            string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname;
    `);

    if (enumsRes.rows.length > 0) {
        sections.push(`---\n## Enums (${enumsRes.rows.length})\n`);
        sections.push(`| Enum | Values |`);
        sections.push(`|------|--------|`);
        for (const e of enumsRes.rows) {
            sections.push(`| ${e.enum_name} | ${e.values} |`);
        }
        sections.push('');
    }

    // ── 7. INDEXES ──
    console.log('📇 Fetching indexes...');
    const indexesRes = await client.query(`
        SELECT
            tablename,
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname;
    `);

    if (indexesRes.rows.length > 0) {
        sections.push(`---\n## Indexes (${indexesRes.rows.length}, excluding PKs)\n`);
        sections.push(`| Table | Index | Definition |`);
        sections.push(`|-------|-------|------------|`);
        for (const idx of indexesRes.rows) {
            const def = idx.indexdef.length > 80
                ? idx.indexdef.substring(0, 77) + '...'
                : idx.indexdef;
            sections.push(`| ${idx.tablename} | ${idx.indexname} | \`${def}\` |`);
        }
        sections.push('');
    }

    // ── WRITE FILE ──
    const outputDir = path.resolve(__dirname, '..', 'DB');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'SCHEMA.md');
    fs.writeFileSync(outputPath, sections.join('\n'), 'utf-8');

    await client.end();

    console.log(`\n✅ Schema written to DB/SCHEMA.md`);
    console.log(`   📊 ${tablesRes.rows.length} tables`);
    console.log(`   👁️  ${viewsRes.rows.length} views`);
    console.log(`   ⚙️  ${funcsRes.rows.length} functions`);
    console.log(`   ⚡  ${triggersRes.rows.length} triggers`);
    console.log(`   🛡️  ${rlsRes.rows.length} RLS policies`);
    console.log(`   📦  ${enumsRes.rows.length} enums`);
    console.log(`   📇  ${indexesRes.rows.length} indexes`);
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    client.end();
    process.exit(1);
});

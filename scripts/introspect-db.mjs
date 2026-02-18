/**
 * Database Schema Introspection Script
 * =====================================
 * Connects to Supabase PostgreSQL (READ-ONLY queries) and generates
 * split schema files in DB/schema/ with all tables, columns, functions,
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

    // ── WRITE FILES ──
    const outputDir = path.resolve(__dirname, '..', 'DB');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // NOTE: Monolithic SCHEMA.md no longer generated.
    // Only split files in DB/schema/ are written.

    // ── SPLIT INTO INDIVIDUAL FILES ──
    // Write each section to a separate file for easier searching/reading
    const schemaDir = path.join(outputDir, 'schema');
    if (fs.existsSync(schemaDir)) {
        // Clean old files
        for (const f of fs.readdirSync(schemaDir)) {
            fs.unlinkSync(path.join(schemaDir, f));
        }
    } else {
        fs.mkdirSync(schemaDir, { recursive: true });
    }

    const header = [
        `# Database Schema (Auto-generated)`,
        `> Generated: ${new Date().toISOString()}`,
        `> Source: Supabase PostgreSQL (read-only introspection)`,
        `> ⚠️ This file is auto-generated. Do NOT edit manually.\n`,
    ].join('\n');

    // 1. Tables — split into chunks of ~30 tables each for readability
    const tableNames = tablesRes.rows.map(t => t.table_name);
    const TABLES_PER_FILE = 30;
    for (let i = 0; i < tableNames.length; i += TABLES_PER_FILE) {
        const chunk = tableNames.slice(i, i + TABLES_PER_FILE);
        const fileIndex = Math.floor(i / TABLES_PER_FILE) + 1;
        const tableLines = [header, `## Tables (chunk ${fileIndex}: ${chunk[0]} — ${chunk[chunk.length - 1]})\n`];

        for (const name of chunk) {
            const cols = columnsByTable[name] || [];
            const pks = pkByTable[name] || new Set();
            const fks = fkByTable[name] || [];
            const uniques = uniqueByTable[name] || new Set();

            tableLines.push(`### \`${name}\`\n`);
            tableLines.push(`| Column | Type | Nullable | Default | Constraints |`);
            tableLines.push(`|--------|------|----------|---------|-------------|`);

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

                tableLines.push(`| ${col.column_name} | ${type} | ${nullable} | ${def} | ${constraints.join(', ')} |`);
            }
            tableLines.push('');
        }

        fs.writeFileSync(path.join(schemaDir, `tables_${fileIndex}.md`), tableLines.join('\n'), 'utf-8');
    }

    // 2. Views
    if (viewsRes.rows.length > 0) {
        const viewLines = [header, `## Views (${viewsRes.rows.length})\n`];
        for (const view of viewsRes.rows) {
            viewLines.push(`### \`${view.table_name}\`\n`);
            viewLines.push('```sql');
            viewLines.push(view.view_definition?.trim() || '-- (definition not available)');
            viewLines.push('```\n');
        }
        fs.writeFileSync(path.join(schemaDir, 'views.md'), viewLines.join('\n'), 'utf-8');
    }

    // 3. Functions — split into chunks for readability (same pattern as tables)
    if (funcsRes.rows.length > 0) {
        const FUNCS_PER_FILE = 20;
        for (let i = 0; i < funcsRes.rows.length; i += FUNCS_PER_FILE) {
            const chunk = funcsRes.rows.slice(i, i + FUNCS_PER_FILE);
            const fileIndex = Math.floor(i / FUNCS_PER_FILE) + 1;
            const funcLines = [header, `## Functions & Procedures (chunk ${fileIndex}: ${chunk[0].name} — ${chunk[chunk.length - 1].name})\n`];

            for (const fn of chunk) {
                const badge = fn.security === 'SECURITY DEFINER' ? ' 🔐' : '';
                funcLines.push(`### \`${fn.name}(${fn.args})\`${badge}\n`);
                funcLines.push(`- **Returns**: ${fn.return_type}`);
                funcLines.push(`- **Kind**: ${fn.kind} | ${fn.volatility} | ${fn.security}\n`);
                funcLines.push('<details><summary>Source</summary>\n');
                funcLines.push('```sql');
                funcLines.push(fn.definition?.trim() || '-- (source not available)');
                funcLines.push('```\n</details>\n');
            }
            fs.writeFileSync(path.join(schemaDir, `functions_${fileIndex}.md`), funcLines.join('\n'), 'utf-8');
        }
    }

    // 4. Triggers
    if (triggersRes.rows.length > 0) {
        const triggerEvents = {};
        for (const t of triggersRes.rows) {
            const key = `${t.table_name}.${t.trigger_name}`;
            if (!triggerEvents[key]) triggerEvents[key] = { ...t, events: [] };
            triggerEvents[key].events.push(t.event);
        }

        const trigLines = [header, `## Triggers (${Object.keys(triggerEvents).length})\n`];
        trigLines.push(`| Table | Trigger | Timing | Events | Action |`);
        trigLines.push(`|-------|---------|--------|--------|--------|`);
        for (const t of Object.values(triggerEvents)) {
            const action = t.action_statement.length > 60
                ? t.action_statement.substring(0, 57) + '...'
                : t.action_statement;
            trigLines.push(`| ${t.table_name} | ${t.trigger_name} | ${t.timing} | ${t.events.join(', ')} | ${action} |`);
        }
        trigLines.push('');
        fs.writeFileSync(path.join(schemaDir, 'triggers.md'), trigLines.join('\n'), 'utf-8');
    }

    // 5. RLS Policies
    if (rlsRes.rows.length > 0) {
        const rlsByTable = {};
        for (const p of rlsRes.rows) {
            if (!rlsByTable[p.tablename]) rlsByTable[p.tablename] = [];
            rlsByTable[p.tablename].push(p);
        }

        const rlsLines = [header, `## RLS Policies (${rlsRes.rows.length})\n`];
        for (const [table, policies] of Object.entries(rlsByTable)) {
            rlsLines.push(`### \`${table}\` (${policies.length} policies)\n`);
            for (const p of policies) {
                rlsLines.push(`#### ${p.policyname}\n`);
                rlsLines.push(`- **Command**: ${p.cmd} | **Permissive**: ${p.permissive}`);
                rlsLines.push(`- **Roles**: ${p.roles}`);
                if (p.qual) {
                    rlsLines.push(`- **USING**:`);
                    rlsLines.push('```sql');
                    rlsLines.push(p.qual);
                    rlsLines.push('```');
                }
                if (p.with_check) {
                    rlsLines.push(`- **WITH CHECK**:`);
                    rlsLines.push('```sql');
                    rlsLines.push(p.with_check);
                    rlsLines.push('```');
                }
                rlsLines.push('');
            }
        }
        fs.writeFileSync(path.join(schemaDir, 'rls.md'), rlsLines.join('\n'), 'utf-8');
    }

    // 6. Enums
    if (enumsRes.rows.length > 0) {
        const enumLines = [header, `## Enums (${enumsRes.rows.length})\n`];
        enumLines.push(`| Enum | Values |`);
        enumLines.push(`|------|--------|`);
        for (const e of enumsRes.rows) {
            enumLines.push(`| ${e.enum_name} | ${e.values} |`);
        }
        enumLines.push('');
        fs.writeFileSync(path.join(schemaDir, 'enums.md'), enumLines.join('\n'), 'utf-8');
    }

    // 7. Indexes
    if (indexesRes.rows.length > 0) {
        const idxLines = [header, `## Indexes (${indexesRes.rows.length}, excluding PKs)\n`];
        idxLines.push(`| Table | Index | Definition |`);
        idxLines.push(`|-------|-------|------------|`);
        for (const idx of indexesRes.rows) {
            const def = idx.indexdef.length > 80
                ? idx.indexdef.substring(0, 77) + '...'
                : idx.indexdef;
            idxLines.push(`| ${idx.tablename} | ${idx.indexname} | \`${def}\` |`);
        }
        idxLines.push('');
        fs.writeFileSync(path.join(schemaDir, 'indexes.md'), idxLines.join('\n'), 'utf-8');
    }

    // 8. Comprehensive index (quick reference for tables, functions, views)
    const indexFileLines = [header, `## Table Index\n`, `All ${tableNames.length} tables, alphabetical:\n`];
    for (const name of tableNames) {
        const cols = columnsByTable[name] || [];
        const fks = fkByTable[name] || [];
        const fkList = fks.map(f => `${f.column_name} → ${f.foreign_table}`).join(', ');
        indexFileLines.push(`- **\`${name}\`** (${cols.length} cols${fkList ? ` | FK: ${fkList}` : ''})`);
    }
    indexFileLines.push('');

    // Function index
    if (funcsRes.rows.length > 0) {
        indexFileLines.push(`---\n## Function Index\n`);
        indexFileLines.push(`All ${funcsRes.rows.length} functions/procedures:\n`);
        const FUNCS_PER_FILE_IDX = 20;
        for (let i = 0; i < funcsRes.rows.length; i++) {
            const fn = funcsRes.rows[i];
            const fileIndex = Math.floor(i / FUNCS_PER_FILE_IDX) + 1;
            const badge = fn.security === 'SECURITY DEFINER' ? ' 🔐' : '';
            indexFileLines.push(`- \`${fn.name}(${fn.args})\` → ${fn.return_type}${badge} *(functions_${fileIndex}.md)*`);
        }
        indexFileLines.push('');
    }

    // View index
    if (viewsRes.rows.length > 0) {
        indexFileLines.push(`---\n## View Index\n`);
        for (const view of viewsRes.rows) {
            indexFileLines.push(`- **\`${view.table_name}\`**`);
        }
        indexFileLines.push('');
    }
    fs.writeFileSync(path.join(schemaDir, '_index.md'), indexFileLines.join('\n'), 'utf-8');

    await client.end();

    const splitFiles = fs.readdirSync(schemaDir);
    console.log(`\n✅ Schema written to ${splitFiles.length} files in DB/schema/`);
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

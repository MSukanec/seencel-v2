const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');

const replacements = [
    {
        oldStr: '@/components/layout/dashboard/shell/page-wrapper',
        newStr: '@/components/layout/page/page-wrapper'
    },
    {
        oldStr: '@/components/layout/dashboard/shell/content-layout',
        newStr: '@/components/layout/page/content-layout'
    },
    {
        oldStr: '@/components/layout/dashboard/shell/split-editor-layout',
        newStr: '@/components/layout/page/split-editor-layout'
    },
    {
        oldStr: '@/components/layout/dashboard/shell/page-intro',
        newStr: '@/components/shared/page-intro'
    },
    {
        oldStr: '@/components/layout/dashboard/shell/impersonation-banner',
        newStr: '@/components/layout/dashboard/shell/banners/impersonation-banner'
    },
    {
        oldStr: '@/components/layout/dashboard/shell/viewing-as-banner',
        newStr: '@/components/layout/dashboard/shell/banners/viewing-as-banner'
    },
    // Fix layout-switcher.tsx internal relative imports
    {
        oldStr: './impersonation-banner',
        newStr: './banners/impersonation-banner'
    },
    {
        oldStr: './viewing-as-banner',
        newStr: './banners/viewing-as-banner'
    },
    // Fix layout index.ts
    {
        oldStr: './dashboard/shell/page-wrapper',
        newStr: './page/page-wrapper'
    },
    {
        oldStr: './dashboard/shell/content-layout',
        newStr: './page/content-layout'
    },
    {
        oldStr: './dashboard/shell/page-intro',
        newStr: '../shared/page-intro'
    },
    // Fix global imports from "shell" instead of file
    {
        oldStr: 'from "@/components/layout/dashboard/shell"',
        newStr: 'from "@/components/layout"'
    }
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Only run relative fixes on layout-switcher.tsx
            if (path.basename(fullPath) === 'layout-switcher.tsx') {
                if (content.includes('./impersonation-banner')) {
                    content = content.replace(/['"]\.\/impersonation-banner['"]/g, "'./banners/impersonation-banner'");
                    modified = true;
                }
                if (content.includes('./viewing-as-banner')) {
                    content = content.replace(/['"]\.\/viewing-as-banner['"]/g, "'./banners/viewing-as-banner'");
                    modified = true;
                }
            } else if (path.basename(fullPath) === 'index.ts' && fullPath.includes('layout')) {
                // Done via global replacements usually, but safety check 
            }

            // Apply global replacements
            for (const rep of replacements) {
                // skip relative ones for general files
                if (rep.oldStr.startsWith('./')) continue;

                if (content.includes(rep.oldStr)) {
                    // Use literal replace using split/join to avoid regex escape issues
                    content = content.split(rep.oldStr).join(rep.newStr);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed', fullPath);
            }
        }
    }
}

// Special fixes for file contents 
processDir(srcPath);

// Fix src/components/layout/dashboard/shell/index.ts since we removed the files.
// We must remove the PageWrapper / ContentLayout exports from it, and make a new index.ts in page/
const shellIndex = path.join(srcPath, 'components', 'layout', 'dashboard', 'shell', 'index.ts');
if (fs.existsSync(shellIndex)) {
    fs.writeFileSync(shellIndex, `// Shell Components
export { LayoutSwitcher } from "./layout-switcher";
`, 'utf8');
    console.log('Fixed shell/index.ts');
}

const pageIndex = path.join(srcPath, 'components', 'layout', 'page', 'index.ts');
fs.writeFileSync(pageIndex, `// Page structural components
export { PageWrapper } from "./page-wrapper";
export type { RouteTab } from "./page-wrapper";
export { ContentLayout } from "./content-layout";
export * from "./split-editor-layout";
`, 'utf8');
console.log('Created page/index.ts');

console.log('Done!');
